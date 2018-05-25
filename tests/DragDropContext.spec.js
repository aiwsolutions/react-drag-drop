import sinon from 'sinon';
import DragDropContext from '../src/DragDropContext';
import * as utils from '../src/utils';

test('DragDropContext - startDragging', () => {
    sinon.spy(utils, 'lockDownSelection');
    sinon.spy(document, 'addEventListener');
    const source = {
        props: {
            uniqueId: 1
        }
    };
    DragDropContext.updateDraggable(source, {
        left: 0, top: 0, right: 100, bottom: 50
    });
    DragDropContext.startDragging(source, { lastX: 10, lastY: 10, data: true });

    expect(DragDropContext.getCurrentSource()).toBe(source);
    expect(utils.lockDownSelection.withArgs(true).calledOnce).toBeTruthy();
    expect(document.addEventListener.calledTwice).toBeTruthy();
    expect(document.addEventListener.getCall(0).args[0]).toBe('mousemove');
    expect(document.addEventListener.getCall(1).args[0]).toBe('mouseup');

    utils.lockDownSelection.restore();
    document.addEventListener.restore();
});

jest.mock('react-dom', () => ({
    findDOMNode: () => ({
        cloneNode: () => ({
            style: {}
        })
    })
}));

test('DragDropContext - handleDrag', () => {
    sinon.stub(document.body, 'appendChild');

    const source = {
        props: {
            uniqueId: 1,
            onDrag: sinon.stub()
        },
        setDragging: sinon.stub()
    };

    source.props.onDrag.returns(true);

    DragDropContext.updateDraggable(source, {
        left: 0, top: 0, right: 100, bottom: 50
    });

    DragDropContext.handleDrag({});

    // a cloned version is appended to body
    expect(document.body.appendChild.calledOnce).toBeTruthy();
    expect(document.body.appendChild.getCall(0).args[0]).toMatchObject({
        style: {
            width: '100px',
            height: '50px',
            left: '0px',
            top: '0px'
        }
    });

    expect(source.props.onDrag.calledOnce).toBeTruthy();
    expect(source.setDragging.withArgs(true).calledOnce).toBeTruthy();
    document.body.appendChild.restore();
});

test('DragDropContext - handleDragComplete', () => {
    sinon.stub(document.body, 'removeChild');
    sinon.spy(document, 'removeEventListener');

    const source = {
        props: {
            uniqueId: 1,
            onDrop: sinon.stub()
        },
        setDragging: sinon.stub()
    };

    DragDropContext.updateDraggable(source, {
        left: 0, top: 0, right: 100, bottom: 50
    });

    DragDropContext.handleDragComplete({});
    expect(source.props.onDrop.calledOnce).toBeTruthy();
    expect(source.setDragging.withArgs(false).calledOnce).toBeTruthy();
    expect(document.removeEventListener.calledTwice).toBeTruthy();
    expect(DragDropContext.getCurrentSource()).toBeNull();

    document.body.removeChild.restore();
    document.removeEventListener.restore();
});

