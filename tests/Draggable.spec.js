import React from 'react';
import renderer from 'react-test-renderer';
import sinon from 'sinon';
import Draggable from '../src/Draggable';
import DragDropContext from '../src/DragDropContext';

jest.mock('react-dom', () => ({
    findDOMNode: () => ({
        getBoundingClientRect: () => ({
            left: 0, top: 0, right: 0, bottom: 0
        })
    })
}));

function renderSampleComponent() {
    return renderer.create(
        <Draggable
            uniqueId="1"
            type="test"
            onDragStart={f => f}
        >
            {
                handlers =>
                    <div
                        {...handlers}
                        className="test"
                        style={{ backgroundColor: '#0000ff' }}
                    >
                        Sample content
                    </div>
            }
        </Draggable>
    );
}

test('<Draggable> - must render children as it is', () => {
    expect(renderSampleComponent().toJSON()).toMatchSnapshot();
});

test('<Draggable> - when the component is mounted, it updates its boundary to cache', () => {
    sinon.spy(DragDropContext, 'updateDraggable');
    renderSampleComponent();
    expect(DragDropContext.updateDraggable.calledOnce).toBeTruthy();
    DragDropContext.updateDraggable.restore();
});

test('<Draggable> - when the component is updated, it updates its boundary to cache', () => {
    sinon.spy(DragDropContext, 'updateDraggable');

    const comp = renderSampleComponent();
    comp.getInstance().componentDidUpdate();

    expect(DragDropContext.updateDraggable.calledTwice).toBeTruthy();
    DragDropContext.updateDraggable.restore();
});

function buildLeftClickEvent() {
    return {
        button: 0,
        stopPropagation: sinon.stub(),
        pageX: 0,
        pageY: 0
    };
}

test('<Draggable> - when left click on the component, it must call DragDropContext.startDragging', () => {
    sinon.spy(DragDropContext, 'startDragging');

    const comp = renderSampleComponent();
    comp.root.findByType('div').props.onMouseDown(buildLeftClickEvent());

    expect(DragDropContext.startDragging.calledOnce).toBeTruthy();
    expect(DragDropContext.startDragging.getCall(0).args[1])
        .toMatchObject({ lastX: 0, lastY: 0, data: { pageX: 0, pageY: 0 } });
    DragDropContext.startDragging.restore();
});

test('<Draggable> - if onDragStart does not return data, then startDragging should not be called', () => {
    sinon.spy(DragDropContext, 'startDragging');

    const comp = renderer.create(
        <Draggable
            uniqueId={2}
            type="test"
            onDragStart={() => false}
        >
            {
                handlers => <div {...handlers} />
            }
        </Draggable>
    );
    comp.root.findByType('div').props.onMouseDown(buildLeftClickEvent());
    expect(DragDropContext.startDragging.notCalled).toBeTruthy();
});

function renderDraggableWithPressHandler(pressHandler) {
    return renderer.create(
        <Draggable
            uniqueId={3}
            type="test"
            onPressed={pressHandler}
        >
            {handlers => <div {...handlers} />}
        </Draggable>
    );
}

test('<Draggable> - mouse up will call onPressed if the context does not handle drag', () => {
    sinon.stub(DragDropContext, 'shouldContextHandleEvent').returns(false);
    const pressHandler = sinon.stub();

    const comp = renderDraggableWithPressHandler(pressHandler);

    comp.root.findByType('div').props.onMouseUp(buildLeftClickEvent());
    expect(pressHandler.calledOnce).toBeTruthy();
    DragDropContext.shouldContextHandleEvent.restore();
});

test('<Draggable> - mouse up will not call onPressed if there is movement', () => {
    sinon.stub(DragDropContext, 'shouldContextHandleEvent').returns(true);
    const pressHandler = sinon.stub();

    const comp = renderDraggableWithPressHandler(pressHandler);

    comp.root.findByType('div').props.onMouseUp(buildLeftClickEvent());
    expect(pressHandler.notCalled).toBeTruthy();
    DragDropContext.shouldContextHandleEvent.restore();
});
