/* eslint react/no-find-dom-node: 0 */
import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';

let matchesSelectorFunc;
export function matchesSelector(el, selector) {
    if (_.isArray(selector)) {
        return _.some(selector, sel => matchesSelectorSingle(el, sel));     // eslint-disable-line
    }
    return matchesSelectorSingle(el, selector);                             // eslint-disable-line
}

function matchesSelectorSingle(el, selector) {
    if (!el) {
        return false;
    }

    if (!matchesSelectorFunc) {
        matchesSelectorFunc = _.find(
            [
                'matches',
                'webkitMatchesSelector',
                'mozMatchesSelector',
                'msMatchesSelector',
                'oMatchesSelector'
            ],
            method => _.isFunction(el[method])
        );
    }
    return el[matchesSelectorFunc].call(el, selector);
}

export function getComponentBoundary(component) {
    const domNode = ReactDOM.findDOMNode(component);
    return domNode.getBoundingClientRect();
}

/* eslint no-underscore-dangle: 0 */
let __touchable;
export function isTouchable() {
    if (__touchable === undefined) {
        __touchable = 'ontouchstart' in window || navigator.maxTouchPoints;
    }
    return __touchable;
}

/* eslint no-param-reassign: 0 */
export function addClass(element, clazz) {
    const elementClasses = _.split(element.className, ' ');
    element.className = _.join(_.union(elementClasses, [clazz]), ' ');
}

export function removeClass(element, clazz) {
    const elementClasses = _.split(element.className, ' ');
    element.className = _.join(_.difference(elementClasses, [clazz]), ' ');
}

export function lockDownSelection(lock) {
    if (lock) {
        addClass(document.body, 'no-selection');
    } else {
        removeClass(document.body, 'no-selection');
    }
}

const overflowRegex = /(auto|scroll)/;
export function getScrollingElement(element) {
    if (!element) {
        return document.scrollingElement || document.documentElement;
    }
    let style = getComputedStyle(element);
    if (style.position === 'fixed') return document.body;
    const excludeStaticParent = style.position === 'absolute';

    let parent = element;
    while (parent !== document.body && parent !== document.documentElement) {
        style = getComputedStyle(parent);
        if ((!excludeStaticParent || style.position !== 'static')
            && overflowRegex.test(style.overflow + style.overflowY + style.overflowX)) {
            return parent;
        }
        parent = parent.parentElement;
    }
    return document.scrollingElement || document.documentElement;
}

export function getRectData(node, uniqueId, {
    left, top, right, bottom
}, extraData) {
    const element = React.isValidElement(node) && ReactDOM.findDOMNode(node);
    const scrollElement = getScrollingElement(element);
    return {
        ...extraData,
        uniqueId,
        minX: left + scrollElement.scrollLeft,
        maxX: right + scrollElement.scrollLeft,
        minY: top + scrollElement.scrollTop,
        maxY: bottom + scrollElement.scrollTop
    };
}

export function getDirection(last, current) {
    if (current > last) {
        return 1;
    } else if (current < last) {
        return -1;
    }
    return 0;
}
