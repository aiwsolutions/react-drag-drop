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

export function isValidDOMElement(element) {
    return element && element.nodeType === Node.ELEMENT_NODE;
}

export function findDOMNode(element) {
    if (React.Component.prototype.isPrototypeOf(element)) {       // eslint-disable-line
        return ReactDOM.findDOMNode(element);
    }
    return isValidDOMElement(element) ? element : null;
}

const overflowRegex = /(auto|scroll)/;
export function getScrollingElement(element) {
    const domElement = findDOMNode(element);
    if (!domElement) {
        return document.scrollingElement || document.documentElement;
    }
    let style = getComputedStyle(domElement);
    if (style.position === 'fixed') return document.body;
    const excludeStaticParent = style.position === 'absolute';

    let parent = domElement;
    while (parent && parent !== document.body) {
        style = getComputedStyle(parent);
        if ((!excludeStaticParent || style.position !== 'static')
            && overflowRegex.test(style.overflow + style.overflowY + style.overflowX)) {
            return parent;
        }
        parent = parent.parentElement;
    }
    return document.scrollingElement || document.documentElement;
}

export function getAbsoluteOffsetOf(element) {
    let offsetX = window.pageXOffset !== undefined ? window.pageXOffset
        : (document.documentElement || document.body).scrollLeft;
    let offsetY = window.pageYOffset !== undefined ? window.pageYOffset
        : (document.documentElement || document.body).scrollTop;

    let parent = findDOMNode(element);
    while (parent && parent !== document.body) {
        offsetX += parent.scrollLeft || 0;
        offsetY += parent.scrollTop || 0;
        parent = parent.parentElement;
    }
    return {
        offsetX,
        offsetY
    };
}

export function getRectData(node, uniqueId, {
    left, top, right, bottom
}, extraData) {
    const { offsetX, offsetY } = getAbsoluteOffsetOf(node);
    return {
        ...extraData,
        uniqueId,
        minX: left + offsetX,
        maxX: right + offsetX,
        minY: top + offsetY,
        maxY: bottom + offsetY
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
