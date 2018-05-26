import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Draggable, Droppable } from '../src';
import Item from './Item';
import Group from './Group';
import DragDropContext from '../src/DragDropContext';

class SortableGroup extends React.Component {
    static propTypes = {
        id: PropTypes.any.isRequired,
        items: PropTypes.array,
        onItemOverred: PropTypes.func.isRequired,
        color: PropTypes.string.isRequired
    }

    constructor(props) {
        super(props);
        this.state = {
            items: props.items
        };
    }

    componentWillReceiveProps(nextProps) {
        if (!_.isEqual(this.props.items, nextProps.items)) {
            this.setState({ items: nextProps.items });
        }
    }

    moveItem = (fromIndex, toIndex) => {
        const { items } = this.state;
        items.splice(toIndex, 0, items.splice(fromIndex, 1)[0]);
        this.setState({ items });
    }

    handleDragItem = ({ data }) => {
        const { items } = this.state;
        const overredItemBoundary = _.find(DragDropContext.getOverredBoundaries(),
            ({ uniqueId }) => _.find(items, ({ id }) => id === uniqueId)
        );

        if (!overredItemBoundary || overredItemBoundary.uniqueId === data) {
            return true;
        }

        const itemIndex = _.findIndex(items, ({ id }) => data === id);
        const overredItemIndex = _.findIndex(items, ({ id }) => overredItemBoundary.uniqueId === id);

        this.moveItem(itemIndex, overredItemIndex);

        // accept the move
        return true;
    }

    renderItem = ({ id, text }, index) =>
        <Draggable
            key={id}
            uniqueId={id}
            type="sortable"
            onDragStart={() => id}
            onDrag={this.handleDragItem}
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
        </Draggable>

    render() {
        const {
            items
        } = this.state;

        const {
            id, color, onItemOverred
        } = this.props;

        return (
            <Droppable
                uniqueId={id}
                acceptTypes={['sortable']}
                onDraggedSourceOverred={onItemOverred}
            >
                {
                    hovered =>
                        <Group
                            hovered={hovered}
                            items={items}
                            color={color}
                            itemRenderer={this.renderItem}
                        />
                }
            </Droppable>
        );
    }
}

export default SortableGroup;
