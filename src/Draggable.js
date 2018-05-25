/**
 * Copyright by AIWSolutions.
 */
import React from 'react';
import PropTypes from 'prop-types';
import DragDropContext from './DragDropContext';
import { matchesSelector, getComponentBoundary } from './utils';

class Draggable extends React.Component {
    static propTypes = {
        /**
          * Unique id for the component
          */
        uniqueId: PropTypes.any.isRequired,

        /**
         * Start dragging the object.
         * Return the data associated with this element
         * Return false/null to prevent the dragging
         */
        onDragStart: PropTypes.func,

        /**
         * Dragging the object.
         * Return true to accept the move, false to deny
         * Arguments: {deltaX, deltaY}
         */
        onDrag: PropTypes.func,

        /**
         * Stop dragging.
         * Callback only
         */
        onDrop: PropTypes.func,

        /**
         * Call when there is click or touch without dragging or resizing
         */
        onPressed: PropTypes.func,

        /**
         * Callback function for both componentDidUpdate & componentDidMount & dragging
         * with boundary client rect
         */
        onRendered: PropTypes.func,

        /**
         * Callback function for componentWillUnmount
         */
        onUnmount: PropTypes.func,

        /**
         * Skip decorating for selector
         */
        skip: PropTypes.node,

        /**
         * Only decorating for handle
         */
        handle: PropTypes.node,

        /**
         * The type for matching with Droppable
         */
        type: PropTypes.string.isRequired,

        shadowing: PropTypes.bool
    };

    constructor(props) {
        super(props);
        this.state = {
            dragging: DragDropContext.getCurrentSource()
                && DragDropContext.getCurrentSource().props.uniqueId === props.uniqueId
                && DragDropContext.shouldContextHandleEvent()
        };
    }

    componentDidMount() {
        this.updateDraggable();
    }

    componentDidUpdate() {
        this.updateDraggable();
    }

    componentWillUnmount() {
        const { onUnmount } = this.props;
        if (onUnmount) {
            onUnmount();
        }
        DragDropContext.unmountDraggable(this);
    }

    setDragging = dragging => this.setState({ dragging });

    updateDraggable = () => {
        const { onRendered } = this.props;
        const boundary = getComponentBoundary(this);
        DragDropContext.updateDraggable(this, boundary);
        if (onRendered) {
            onRendered(boundary);
        }
    }

    isAcceptedEvent = ({ button, target }) => {
        // left click only
        if (button !== 0) return false;
        if (this.props.disabled) return false;

        // check again for skip && handle
        const { skip, handle } = this.props;
        if (skip && matchesSelector(target, skip)) return false;
        if (handle && !matchesSelector(target, handle)) return false;
        return true;
    }

    handleMouseDown = (event) => {
        if (!DragDropContext.isEnabled() || this.props.disabled || !this.isAcceptedEvent(event)) {
            return false;
        }
        const {
            clientX, clientY, pageX, pageY
        } = event;

        const {
            onDragStart
        } = this.props;

        // if this instance can be dragged or resized, then should not others.
        event.stopPropagation();

        const data = onDragStart({
            clientX, clientY, pageX, pageY
        });

        if (!data) {
            return false;
        }

        DragDropContext.startDragging(this, {
            lastX: pageX,
            lastY: pageY,
            data
        });
        return true;
    };

    handleTouchStart = (e) => {
        const touch = e.nativeEvent.targetTouches[0];
        this.handleMouseDown({
            button: 0,
            clientX: touch.clientX,
            clientY: touch.clientY,
            pageX: touch.pageX,
            pageY: touch.pageY,
            target: touch.target,
            stopPropagation: e.stopPropagation
        });
    };

    handleMouseUp = (e) => {
        if (!DragDropContext.isEnabled() || !this.isAcceptedEvent(e)) {
            return;
        }
        const { onPressed } = this.props;
        if (!DragDropContext.shouldContextHandleEvent() && onPressed) {
            e.stopPropagation();
            onPressed(e);
        }
    };

    handleTouchEnd = (e) => {
        const touch = e.nativeEvent.targetTouches[0];
        this.handleMouseUp({
            ...touch,
            stopPropagation: e.stopPropagation
        });
    }

    handleMovedTo = position => this.dragListener && this.dragListener(position);

    render() {
        const { children } = this.props;
        const { dragging } = this.state;
        if (dragging) {
            const cacheBoundary = DragDropContext.getCacheBoundary();
            // We only draw a placeholder when it is dragging
            if (cacheBoundary) {
                const { minX, maxX, minY, maxY } = cacheBoundary;
                return (
                    <div
                        style={{
                            width: maxX - minX,
                            height: maxY - minY
                        }}
                    />
                );
            }
        }

        const handlers = {
            onTouchStart: this.handleTouchStart,
            onMouseDown: this.handleMouseDown,
            onMouseMove: this.handleMouseMove,
            onMouseUp: this.handleMouseUp,
            onTouchEnd: this.handleTouchEnd
        };

        const renderedChildren = children(handlers);

        return renderedChildren && React.Children.only(renderedChildren);
    }
}

export default Draggable;
