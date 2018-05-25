/**
 * Copyright by AIWSolutions.
 */
import { findDOMNode } from 'react-dom';
import rbush from 'rbush';
import _ from 'lodash';
import { isTouchable, lockDownSelection, getScrollElement, getDirection, getRectData } from './utils';

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

    addBoundary(uniqueId, boundary, extraData) {
        const rectData = getRectData(uniqueId, boundary, extraData);
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
        this.addBoundary(uniqueId, boundary, {
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
        this.addBoundary(uniqueId, boundary, {
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
        this.currentSource = source;
        this.cache = {
            offsetX: lastX - minX,
            offsetY: lastY - minY,
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
        this.movingDOM = sourceDOM.cloneNode(true);
        // if this is fixed, then we have to accumulate scroll position
        this.movingDOM.style.position = 'absolute';
        this.movingDOM.style.width = `${maxX - minX}px`;
        this.movingDOM.style.height = `${maxY - minY}px`;
        this.movingDOM.style.left = `${minX}px`;
        this.movingDOM.style.top = `${minY}px`;
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
        // set overred boundaries
        this.cache.overredBoundaries = this.boundaries.search({
            minX: e.pageX,
            minY: e.pageY,
            maxX: e.pageX + 1,
            maxY: e.pageY + 1
        });

        const { props: { onDrag, type } } = this.currentSource;
        const dragEvent = this.buildDragEvent(e);
        if (onDrag && !onDrag(dragEvent)) {
            return false;
        }

        const { offsetX, offsetY } = this.cache;
        requestAnimationFrame(() => this.moveMovingDomTo({
            left: e.pageX - offsetX,
            top: e.pageY - offsetY
        }));

        this.findAndNotifyDroppables(type, true);
        _.merge(this.cache, {
            lastX: e.pageX,
            lastY: e.pageY
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
            if (onDraggedSourceOverred({ ...data, ...boundary })) {
                if (this.currentTarget && this.currentTarget.uniqueId !== uniqueId) {
                    this.currentTarget.onDraggedSourceOuted();
                }
                this.currentTarget = droppableBoundary;
                return false;
            }
            return true;
        });
    }

    scrollViewPort({ clientX, clientY }) {
        const viewPortWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        const viewPortHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
        const scrollElement = getScrollElement();
        const scrolledTop = scrollElement.scrollTop;
        const scrolledLeft = scrollElement.scrollLeft;
        if (clientX < this.scrollSensitive && scrolledLeft > 0) {
            scrollElement.scrollLeft = Math.max(0, scrolledLeft - this.scrollSpeed);
        }
        if (clientX > viewPortWidth - this.scrollSensitive) {
            scrollElement.scrollLeft = scrolledLeft + this.scrollSpeed;
        }
        if (clientY < this.scrollSensitive && scrolledTop > 0) {
            scrollElement.scrollTop = Math.max(0, scrolledTop - this.scrollSpeed);
        }
        if (clientY > viewPortHeight - this.scrollSensitive) {
            scrollElement.scrollTop = scrolledTop + this.scrollSpeed;
        }
    }
}

/* eslint no-underscore-dangle: 0 */
if (!window.__iw_drag_drop_context) {
    window.__iw_drag_drop_context = new DragDropContext();
}

export default window.__iw_drag_drop_context;
