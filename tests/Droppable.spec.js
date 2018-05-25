import React from 'react';
import renderer from 'react-test-renderer';
import sinon from 'sinon';
import Droppable from '../src/Droppable';
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
        <Droppable
            uniqueId="1"
            acceptTypes={['test']}
        >
            {
                draggedSourceOver =>
                    <div
                        style={{ borderWidth: draggedSourceOver ? 1 : 0 }}
                    >
                        Sample content
                    </div>
            }
        </Droppable>
    );
}

test('<Droppable> - must render children as it is', () => {
    expect(renderSampleComponent().toJSON()).toMatchSnapshot();
});

test('<Droppable> - when the component is mounted, it updates its boundary to cache', () => {
    sinon.spy(DragDropContext, 'updateDroppable');
    renderSampleComponent();
    expect(DragDropContext.updateDroppable.calledOnce).toBeTruthy();
    DragDropContext.updateDroppable.restore();
});

test('<Droppable> - when the component is updated, it updates its boundary to cache', () => {
    sinon.spy(DragDropContext, 'updateDroppable');

    const comp = renderSampleComponent();
    comp.getInstance().componentDidUpdate();

    expect(DragDropContext.updateDroppable.calledTwice).toBeTruthy();
    DragDropContext.updateDroppable.restore();
});
