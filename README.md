# Super simple drag-n-drop library for react developers

[![CircleCI](https://circleci.com/gh/aiwsolutions/react-drag-drop/tree/master.svg?style=svg&circle-token=b30651548758edc5e3f4ffad6b8f3099a805de9e)](https://circleci.com/gh/aiwsolutions/react-drag-drop/tree/master)
[![npm version](https://badge.fury.io/js/aiws-react-dnd.svg)](https://badge.fury.io/js/aiws-react-dnd)

> tldr; 
> There is no fancy thing in this library compares to others. I just find myself difficult to understand react-dnd and 
> react-beautiful-dnd. They are both amazing with plenty of features and supports. I need a library that allows me to
> apply drag-n-drop quickly and with my customization, if there is any error, I won't spend too much time to understand
> the library. So I wrote this library. It's basically using a cloned DOM for moving affect and improving the speed by 
> caching all the boundaries in [rbush](https://github.com/mourner/rbush) tree.

# Demo
https://aiwsolutions.github.io/react-drag-drop/

### Local Demo
```
npm install
npm run serve
```
then navigate to http://localhost:8080

### Production
https://lackid.com

# Usage

```
npm install --save aiws-react-dnd
```

## Draggable
```
    <Draggable
        uniqueId={1}
        onDragStart={f => f}
        type="draggable"
    >
        {
            handers =>
                <div
                    {...handlers}
                >
                    Draggable Content
                </div>
        }
    </Draggable>
```
Property | Type | Description
-------- | ---- | -----------
uniqueId | any | (Required) The unique id for this Draggable element. It needs to be globally unique for the whole application (both Draggable & Droppable) because the library does cache the boundary of it, for performance improvement.
handle | string | (Optional CSS selector) If exists, then the drag can only be started if the click was on the matched child element (inside the element).
skip | string | (Optional CSS selector) If exists, the drag will be skipped if the click was on this matched element.
type | string | (Required) The type of this element, this is for Droppable to accepts if it was overred.
onDragStart | func | (Required) This function will be called before the dragging happens, it must returns a data for further communication with others Draggable/Droppable otherwise the drag action is discarded.
onDrag | func | (Optional) This function will be called on every movement. Returns false to discard the movement.
onDrop | func | (Optional) This function will be called on releasing mouse.
onPressed | func | (Optional) If there is no movement, this function will be called when there are mouse down and up.
onRendered | func | (Optional) This function will be called on componentDidUpdate, componentDidMount of the element and on dragging.
onUnmount | func | (Optional) This function will be called on componentWillUnmount of the element.

## Droppable
```
    <Droppable
        uniqueId='a'
        onDraggedSourceOverred={handleAddItemToThis}
    >
        {
            hovered =>
                <div
                    style={{
                        hovered ? '1px 1px 2px 1px rgba(0,0,0,0.4)' : 'none',
                    }}
                >
                    Container
                </div>
        }
    </Droppable>
```

Property | Type | Description
-------- | ---- | -----------
uniqueId | any | (Required) The unique id for this Draggable element. It needs to be globally unique for the whole application (both Draggable & Droppable) because the library does cache the boundary of it, for performance improvement.
acceptTypes | array of string | (Optional) List of types of Draggable that this Droppable will accept. If not provided or empty array, then all types will be accepted
onDraggedSourceOverred | func | (Optional) This function will be called when there is a matched type (acceptTypes) of Draggable was dragged on this element. Return a non-false value to accept the element.
onDraggedSourceOuted | func | (Optional) This function will be called if its child element was dragged out of itself.
onRendered | func | (Optional) This function will be called on componentDidUpdate, componentDidMount of the element.
onUnmount | func | (Optional) This function will be called on componentWillUnmount of the element.

# Notice
This library is scallable when using with [aiws-elm](https://github.com/aiwsolutions/aiws-elm).