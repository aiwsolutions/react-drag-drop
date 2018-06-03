import React from 'react';
import _ from 'lodash';
import { Draggable, Droppable } from '../src';
import Item from './Item';
import Group from './Group';
import SortableGroup from './SortableGroup';

class App extends React.Component {
    state = {
        items: [
            {
                id: 1,
                text: 'Please drag me',
                groupId: 'a'
            },
            {
                id: 2,
                text: 'Another item',
                groupId: 'a'
            }
        ],
        sortableItems: _.times(250, n => ({
            id: `s-${n}`,
            text: `Sortable-${n}`,
            groupId: n > 200 ? 'z' : (Math.random() > 0.5 ? 'y' : 'x')  // eslint-disable-line
        }))
    }

    itemRenderer = ({ id, text }, index) =>
        <Draggable
            key={id}
            uniqueId={id}
            onDragStart={() => id}
            type="item"
        >
            {
                handlers =>
                    <Item
                        {...handlers}
                        text={text}
                        style={{
                            marginTop: index > 0 ? 8 : 0
                        }}
                    />
            }
        </Draggable >;

    renderGroupId = (id, color) => {
        const groupItems = _.filter(this.state.items, ({ groupId }) => groupId === id);
        const groupUpdater = ({ data }) => {
            this.setState({
                items: _.map(this.state.items, (it) => {
                    if (data === it.id) {
                        return {
                            ...it,
                            groupId: id
                        };
                    }
                    return it;
                })
            });

            // to accept the item
            return true;
        };

        return (
            <Droppable
                uniqueId={id}
                acceptTypes={['item']}
                onDraggedSourceOverred={groupUpdater}
            >
                {
                    hovered =>
                        <Group
                            color={color}
                            hovered={hovered}
                            items={groupItems}
                            itemRenderer={this.itemRenderer}
                        />
                }
            </Droppable>
        );
    }

    renderSortableGroupId = (id, color) => {
        const groupItems = _.filter(this.state.sortableItems, ({ groupId }) => groupId === id);
        const groupUpdater = ({ data }) => {
            this.setState({
                sortableItems: _.map(this.state.sortableItems, (it) => {
                    if (data === it.id) {
                        return {
                            ...it,
                            groupId: id
                        };
                    }
                    return it;
                })
            });

            // to accept the item
            return true;
        };

        return (
            <SortableGroup
                id={id}
                items={groupItems}
                color={color}
                onItemOverred={groupUpdater}
            />
        );
    }

    render() {
        return (
            <div
                style={{
                    padding: 16
                }}
            >
                <h1>Examples of aiws-react-dnd</h1>
                <h3>Simple use (no sortable)</h3>
                <div
                    style={{
                        float: 'left'
                    }}
                >
                    {this.renderGroupId('a', '#5fbdf7')}
                </div>
                <div
                    style={{
                        float: 'left',
                        marginLeft: 100
                    }}
                >
                    {this.renderGroupId('b', '#feea8b')}
                </div>
                <div
                    style={{
                        float: 'right',
                        maxHeight: 600,
                        minWidth: 200,
                        overflow: 'auto'
                    }}
                >
                    <h1>Scrollable container</h1>
                    {this.renderSortableGroupId('z', '#cceeee')}
                </div>
                <div
                    style={{
                        position: 'absolute',
                        top: 300
                    }}
                >
                    <h3>With proposed implementation of sortable</h3>
                    <div
                        style={{
                            float: 'left'
                        }}
                    >
                        {this.renderSortableGroupId('x', '#cceeee')}
                    </div>
                    <div
                        style={{
                            float: 'left',
                            marginLeft: 100
                        }}
                    >
                        {this.renderSortableGroupId('y', '#cceeee')}
                    </div>
                </div>
            </div>
        );
    }
}

export default App;
