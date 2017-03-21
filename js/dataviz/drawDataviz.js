
import { Text, Graphics, Container } from 'pixi.js';

import { zip } from 'underscore';

import { WHITE } from '../style/color';

import { pointsPositionInRect } from '../utils/points';
import {
    barChart,
    horizontalBarChart,
} from './barchart';

import { RADIUS } from '../components/Supporter';

import { isMobile } from '../utils/window';

const { floor, PI, max } = Math;

const LABEL_STYLE = {
    fontFamily: 'Roboto Mono',
    fontSize:   12,
    fill:       WHITE,
    align:      'center',
};

const createLabelCentered = (text, rotate = false) => {
    const l = new Text(
        text,
        LABEL_STYLE
    );

    const bounds = l.getLocalBounds();
    l.position.x -= (bounds.width / 2);
    l.position.y = 0;

    l.pivot.x = 0;
    l.pivot.y = 0;

    if (rotate) {
        l.rotation = -PI / 4;
        l.position.y += (bounds.width * 0.5) + 20; // cos(PI/4)
    }

    return l;
};

const createLabelRight = (text) => {
    const l = new Text(
        text,
        LABEL_STYLE
    );
    const bounds = l.getLocalBounds();

    l.position.x -= bounds.width - 10;
    l.position.y -= (bounds.height / 2);

    l.pivot.x = 0;
    l.pivot.y = 0;
    return l;
};

export const showBarChart = (
    data,
    { width, height, rotateLegend = false },
    maxValue,
    legendContainer
) => {
    const labels = new Container();
    data
        .map((d) => createLabelCentered(d.label, rotateLegend))
        .forEach((label) => labels.addChild(label));

    const
        legendHeight = labels.getLocalBounds().height,
        realBarHeight = height - legendHeight;

    const bars = barChart({
        data,
        width,
        height: realBarHeight,
        max:    maxValue,
    });

    legendContainer.removeChildren();

    bars.forEach((bar, i) => {
        const positions = pointsPositionInRect(
            bar.value,
            bar.width,
            bar.height
        );

        labels.children[i].position.x
            += (-width / 2) + bar.x + (bar.width / 2);
        labels.children[i].position.y
            += ((height / 2) - legendHeight) + (bar.y + 20);

        zip(bar.points, positions)
            .forEach(([point, position]) => {
                point.moveX(
                    (-width / 2)
                    + position.x
                    + bar.x
                );
                point.moveY(
                    ((height / 2) - legendHeight)
                    + (-position.y + bar.y)
                );
                point.alpha = 1;
                point.changeColor(bar.color);
            });
    });

    legendContainer.addChild(labels);
};

export const showHorizontalBarChart = (
    data,
    { width, height },
    maxValue,
    legendContainer
) => {
    const labels = new Container();
    data
        .map((d) => createLabelRight(d.label))
        .forEach((label) => labels.addChild(label));

    const
        legendWidth = labels.getLocalBounds().width,
        realBarWidth = width - legendWidth;

    const bars = horizontalBarChart({
        data,
        height,
        width: realBarWidth,
        max:   maxValue,
    });

    legendContainer.removeChildren();

    bars.forEach((bar, i) => {
        const positions = pointsPositionInRect(
            bar.value,
            bar.width,
            bar.height
        );

        labels.children[i].position.x
            += ((-width / 2) + legendWidth) + (bar.x - 20);
        labels.children[i].position.y
            += (-height / 2) + (bar.y - (bar.height / 2));

        zip(bar.points, positions)
            .forEach(([point, position]) => {
                point.moveX(
                    ((-width / 2) + legendWidth)
                    + position.x
                    + bar.x
                );
                point.moveY(
                    -(height / 2)
                    + (-position.y + bar.y)
                );
                point.alpha = 1;
                point.changeColor(bar.color);
            });
    });

    legendContainer.addChild(labels);
};

export const showDotMatrix = (
    points,
    colors,
    { width },
    labels,
    legendContainer,
    labelsFull = null
) => {
    const
        w = 10,
        h = 10;

    const
        r = floor(width / w), // number of points per line
        maxHeight = (points.length / r) * h;

    legendContainer.removeChildren();

    const
        legendWrapperLeft = new Container(),
        legendWrapperRight = new Container();

    const
        realLabels = labelsFull || labels,
        l = Object.keys(labelsFull).length;

    const drawLabel = (container) => (key, i) => {
        const label = new Text(
            labelsFull ? labelsFull[key] : key,
            LABEL_STYLE
        );
        const bounds = label.getLocalBounds();

        label.position.x = 15;
        label.position.y = 16 + ((bounds.height + 2) * i);

        const circle = new Graphics();
        circle.beginFill(labels[key]);
        circle.drawCircle(0, 0, RADIUS * 2);
        circle.endFill();

        circle.position.x = 0;
        circle.position.y = 22 + ((bounds.height + 2) * i);

        container.addChild(label);
        container.addChild(circle);
    };

    Object.keys(realLabels).slice(0, floor(l / 2)).forEach(
        drawLabel(legendWrapperLeft)
    );

    Object.keys(realLabels).slice(floor(l / 2) + 1).forEach(
        drawLabel(legendWrapperRight)
    );

    const legendHeight = max(
        legendWrapperLeft.getLocalBounds().height,
        legendWrapperRight.getLocalBounds().height
    );

    const pointYOffset = isMobile()
        ? -legendHeight
        : (-legendHeight / 2);

    points.forEach((point, i) => {
        const
            x = (i % r) * w,
            y = floor(i / r) * h;

        point.moveX((-width / 2) + x);
        point.moveY(-(maxHeight / 2) + pointYOffset + y);
        point.alpha = 1;
        point.changeColor(colors[i]);
    });

    legendWrapperLeft.position.x = (-width / 2);
    legendWrapperLeft.position.y = (maxHeight / 2) + pointYOffset;

    if (!isMobile()) {
        legendWrapperRight.position.x = 0;
        legendWrapperRight.position.y = (maxHeight / 2) + pointYOffset;
    } else {
        legendWrapperRight.position.x = (-width / 2);
        legendWrapperRight.position.y = legendWrapperLeft.position.y
            + legendWrapperLeft.getLocalBounds().height;
    }

    legendContainer.addChild(legendWrapperLeft);
    legendContainer.addChild(legendWrapperRight);
};

