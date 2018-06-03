import rbush from 'rbush';
import _ from 'lodash';
import {
    isTouchable,
    lockDownSelection,
    getScrollingElement,
    getDirection,
    getRectData,
    getAbsoluteOffsetOf,
    findDOMNode
} from './utils';

class DragDropContext {
    boundaries = rbush();
    idBoundaryMap = {};
    cache = {};
    scrollSensitive = 100;
    scrollSpeed = 10;
    enabled = true;

    getCurrentSource() {
        return this.currentSource;
    }

    getCurrentTarget() {
        return this.currentTarget;
    }

    getCacheBoundary() {
        return this.cache.boundary;
    }

    setEnabled(enabled) {
        this.enabled = enabled;
    }

    isEnabled() {
        return this.enabled;
    }

    removeBoundaryOf(uniqueId) {
        const existing = this.idBoundaryMap[uniqueId];
        if (!existing) {
            return;
        }
        this.boundaries.remove(existing, (a, b) => a.uniqueId === b.uniqueId);
        _.unset(this.idBoundaryMap, uniqueId);
    }

    addBoundary(node, uniqueId, boundary, extraData) {
        const rectData = getRectData(node, uniqueId, boundary, extraData);
        this.boundaries.insert(rectData);
        this.idBoundaryMap[uniqueId] = rectData;
    }

    getBoundary(uniqueId) {
        return this.idBoundaryMap[uniqueId];
    }

    getOverredBoundaries() {
        return this.cache.overredBoundaries;
    }

    updateDraggable(source, boundary) {
        const { props: { uniqueId, type } } = source;
        if (!uniqueId) {
            throw new Error('A Draggable must be provided with a unique id');
        }
        this.removeBoundaryOf(uniqueId);
        this.addBoundary(source, uniqueId, boundary, {
            draggable: true,
            type
        });
        if (this.currentSource && this.currentSource.props.uniqueId === uniqueId) {
            this.currentSource = source;
        }
    }

    unmountDraggable({ props: { uniqueId } }) {
        this.removeBoundaryOf(uniqueId);
    }

    updateDroppable(target, boundary, onDraggedSourceOverred, onDraggedSourceOuted) {
        const { props: { uniqueId, acceptTypes } } = target;
        if (!uniqueId) {
            throw new Error('A Droppable must be provided with a unique id');
        }
        this.removeBoundaryOf(uniqueId);
        this.addBoundary(target, uniqueId, boundary, {
            droppable: true,
            acceptTypes,
            onDraggedSourceOverred,
            onDraggedSourceOuted
        });
        if (this.currentTarget && this.currentTarget.uniqueId === uniqueId) {
            this.currentTarget = this.getBoundary(uniqueId);
        }
    }

    unmountDroppable({ props: { uniqueId } }) {
        this.removeBoundaryOf(uniqueId);
    }

    shouldContextHandleEvent() {
        return this.cache.dragging;
    }

    startDragging(source, { lastX, lastY, data }) {
        if (!this.enabled) {
            return;
        }
        const { props: { uniqueId } } = source;
        const boundary = this.getBoundary(uniqueId);
        if (!boundary) {
            throw new Error('Unregistered Draggable with uniqueId', uniqueId);
        }
        const { minX, minY } = boundary;
        const { offsetX, offsetY } = getAbsoluteOffsetOf(source);
        this.currentSource = source;
        this.cache = {
            offsetX: (lastX + offsetX) - minX,
            offsetY: (lastY + offsetY) - minY,
            lastX,
            lastY,
            data,
            boundary
        };

        lockDownSelection(true);
        if (isTouchable()) {
            document.addEventListener('touchmove', this.handleTouchDrag, { passive: false, capture: false });
            document.addEventListener('touchend', this.handleTouchDragComplete);
        } else {
            document.addEventListener('mousemove', this.handleDrag);
            document.addEventListener('mouseup', this.handleDragComplete);
        }
    }

    removeEventListeners() {
        if (isTouchable()) {
            document.removeEventListener('touchmove', this.handleTouchDrag);
            document.removeEventListener('touchend', this.handleTouchResize);
        } else {
            document.removeEventListener('mousemove', this.handleDrag);
            document.removeEventListener('mouseup', this.handleDragComplete);
        }
    }

    drawMovingDom() {
        const sourceDOM = findDOMNode(this.currentSource);  // eslint-disable-line
        if (!sourceDOM) {
            throw new Error('Illegal state: dragged source does not exist');
        }

        // notify source that it is being dragged.
        this.currentSource.setDragging(true);

        const {
            boundary: {
                minX, minY, maxX, maxY
            }
        } = this.cache;

        const { offsetX, offsetY } = getAbsoluteOffsetOf(sourceDOM);

        this.movingDOM = sourceDOM.cloneNode(true);
        // if this is fixed, then we have to accumulate scroll position
        this.movingDOM.style.position = 'fixed';
        // this is to include padding border into width
        this.movingDOM.style.boxSizing = 'border-box';
        this.movingDOM.style.width = `${maxX - minX}px`;
        this.movingDOM.style.height = `${maxY - minY}px`;
        this.movingDOM.style.left = `${minX - offsetX}px`;
        this.movingDOM.style.top = `${minY - offsetY}px`;
        this.movingDOM.style.zIndex = 10000;
        document.body.appendChild(this.movingDOM);
    }

    moveMovingDomTo({ left, top }) {
        if (!this.movingDOM) {
            return;
        }
        this.movingDOM.style.left = `${left}px`;
        this.movingDOM.style.top = `${top}px`;
        // there is a moment that source is mouting to new place
        if (!this.currentSource) {
            return;
        }
        const { props: { onRendered } } = this.currentSource;
        if (onRendered) {
            const {
                boundary: {
                    minX, maxX, minY, maxY
                }
            } = this.cache;
            const width = maxX - minX;
            const height = maxY - minY;
            onRendered({
                left,
                top,
                right: left + width,
                bottom: top + height,
                width,
                height
            });
        }
    }

    clearMovingDom() {
        if (this.movingDOM) {
            document.body.removeChild(this.movingDOM);
            this.movingDOM = null;
        }
    }

    buildDragEvent({
        clientX, clientY, pageX, pageY
    }) {
        const { lastX, lastY, data } = this.cache;
        const deltaX = pageX - lastX;
        const deltaY = pageY - lastY;

        return {
            clientX,
            clientY,
            pageX,
            pageY,
            deltaX,
            deltaY,
            data,
            directionX: getDirection(lastX, pageX),
            directionY: getDirection(lastY, pageY)
        };
    }

    handleDrag = (e) => {
        if (!this.cache.dragging) {
            this.cache.dragging = true;
        }
        if (!this.movingDOM) {
            this.drawMovingDom();
        }

        this.scrollViewPort(e);
        const { offsetX, offsetY } = getAbsoluteOffsetOf(this.currentSource);
        const pageX = e.clientX + offsetX;
        const pageY = e.clientY + offsetY;
        // set overred boundaries
        this.cache.overredBoundaries = this.boundaries.search({
            minX: pageX,
            minY: pageY,
            maxX: pageX + 1,
            maxY: pageY + 1
        });

        const { props: { onDrag, type } } = this.currentSource;
        const dragEvent = this.buildDragEvent(e);
        if (onDrag && !onDrag(dragEvent)) {
            return false;
        }

        requestAnimationFrame(() => this.moveMovingDomTo({
            left: e.clientX - this.cache.offsetX,
            top: e.clientY - this.cache.offsetY
        }));

        this.findAndNotifyDroppables(type, true);
        _.merge(this.cache, {
            lastX: e.clientX,
            lastY: e.clientY
        });
        return true;
    }

    handleDragComplete = (e) => {
        if (this.currentSource) {
            const { props: { onDrop, type } } = this.currentSource;
            if (onDrop) {
                const dragEvent = this.buildDragEvent(e);
                onDrop(dragEvent);
            }
            this.findAndNotifyDroppables(type, false);
            // notify source that is has been released
            this.currentSource.setDragging(false);
        }
        this.removeEventListeners();
        this.clearMovingDom();
        this.currentSource = null;
        this.currentTarget = null;
        this.cache = {};
        lockDownSelection(false);
        return true;
    }

    handleTouchDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const touch = e.targetTouches[0];
        this.handleDrag(touch);
    }

    handleTouchDragComplete = (e) => {
        const touch = e.changedTouches[0];
        this.handleDragComplete(touch);
    }

    findAndNotifyDroppables(type, dragging) {
        if (!dragging && this.currentTarget) {
            this.currentTarget.onDraggedSourceOuted();
            this.currentTarget = null;
            return;
        }

        _.forEach(this.cache.overredBoundaries, (droppableBoundary) => {
            const {
                uniqueId, droppable, acceptTypes, onDraggedSourceOverred
            } = droppableBoundary;
            if (!droppable || (!_.isEmpty(acceptTypes) && !_.includes(acceptTypes, type))) {
                return true;
            }
            // current target already gets fired with onDraggedSourceOverred
            if (this.currentTarget && this.currentTarget.uniqueId === uniqueId) {
                return false;
            }
            const { data, boundary } = this.cache;
            if (onDraggedSourceOverred({ ...boundary, data })) {
                if (this.currentTarget && this.currentTarget.uniqueId !== uniqueId) {
                    this.currentTarget.onDraggedSourceOuted();
                }
                this.currentTarget = droppableBoundary;
                return false;
            }
            return true;
        });
    }

    calculateViewPort = (scrollElement) => {
        if (scrollElement === document.body || scrollElement === document.documentElement || scrollElement === window) {
            return {
                left: 0,
                top: 0,
                right: scrollElement.clientWidth || window.innerWidth,
                bottom: scrollElement.clientHeight || window.innerHeight
            };
        }
        const {
            left, top, right, bottom
        } = scrollElement.getBoundingClientRect();
        return {
            left: Math.max(left, 0),
            top: Math.max(top, 0),
            right: Math.min(right > 0 ? right : Number.MAX_VALUE, window.innerWidth),
            bottom: Math.min(bottom > 0 ? bottom : Number.MAX_VALUE, window.innerHeight)
        };
    }

    scrollViewPort({ clientX, clientY }) {
        const scrollElement = getScrollingElement(this.currentSource);

        const {
            left, top, right, bottom
        } = this.calculateViewPort(scrollElement);

        const scrolledTop = scrollElement.scrollTop;
        const scrolledLeft = scrollElement.scrollLeft;

        if (clientX < left + this.scrollSensitive && scrolledLeft > 0) {
            scrollElement.scrollLeft = Math.max(0, scrolledLeft - this.scrollSpeed);
        }
        if (clientX > right - this.scrollSensitive) {
            scrollElement.scrollLeft = scrolledLeft + this.scrollSpeed;
        }
        if (clientY < top + this.scrollSensitive && scrolledTop > 0) {
            scrollElement.scrollTop = Math.max(0, scrolledTop - this.scrollSpeed);
        }
        if (clientY > bottom - this.scrollSensitive) {
            scrollElement.scrollTop = scrolledTop + this.scrollSpeed;
        }
    }
}

/* eslint no-underscore-dangle: 0 */
if (!window.__iw_drag_drop_context) {
    window.__iw_drag_drop_context = new DragDropContext();
}

export default window.__iw_drag_drop_context;
