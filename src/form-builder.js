import React, { useReducer } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import DropTarget from './drop-target';
import './style.css';
import StoreContext from './store-context';
import PropertiesEditor from './properties-editor';

const COMPONENTS_LIST = 'components-list';
const FORM_LAYOUT = 'form-layout';

const initialData = {
  fields: {
    'initial-component-1': { id: 'initial-component-1', content: 'Some component of type 1' },
    'initial-component-2': { id: 'initial-component-2', content: 'Some component of type 2' },
    'initial-component-3': { id: 'initial-component-3', content: 'Some component of type 3' },
    'initial-component-4': { id: 'initial-component-4', content: 'Some component of type 4' },
    'initial-component-5': { id: 'initial-component-5', content: 'Some component of type 5' },
  },
  dropTargets: {
    [COMPONENTS_LIST]: {
      id: COMPONENTS_LIST,
      title: 'Component chooser',
      fieldsIds: ['initial-component-1', 'initial-component-2', 'initial-component-3', 'initial-component-4', 'initial-component-5'],
    },
    [FORM_LAYOUT]: {
      id: FORM_LAYOUT,
      title: 'Form',
      fieldsIds: [],
    },
  },
  selectedComponent: undefined,
};

const mutateColumns = (result, state) => {
  const {
    destination,
    source,
    draggableId,
  } = result;
  const { dropTargets, fields } = state;
  if (!destination) {
    return {};
  }

  if (
    destination.droppableId === source.droppableId
    && destination.index === source.index
  ) {
    return {};
  }

  const start = dropTargets[source.droppableId];
  const finish = dropTargets[destination.droppableId];
  /**
   * moving in column
   */
  if (start === finish) {
    const newFieldsIds = [...start.fieldsIds];
    newFieldsIds.splice(source.index, 1);
    newFieldsIds.splice(destination.index, 0, draggableId);
    return {
      dropTargets: {
        ...dropTargets,
        [source.droppableId]: { ...start, fieldsIds: newFieldsIds },
      },
    };
  }
  /**
   * Copy to column
   */

  const newId = draggableId.match(/^initial-/) ? draggableId.replace(/^initial-/, '') : draggableId;
  const finishFieldsIds = [...finish.fieldsIds];
  finishFieldsIds.splice(destination.index, 0, newId);
  const newFinish = {
    ...finish,
    fieldsIds: finishFieldsIds,
  };
  return {
    dropTargets: { ...dropTargets, [newFinish.id]: newFinish },
    fields: { ...fields, [newId]: { ...fields[draggableId], id: newId, initialized: false } },
    selectedComponent: newId,
  };
};

const removeComponent = (componentId, state) => {
  const { fields } = state;
  delete fields[componentId];
  return {
    selectedComponent: undefined,
    dropTargets: {
      ...state.dropTargets,
      [FORM_LAYOUT]: {
        ...state.dropTargets[FORM_LAYOUT],
        fieldsIds: state.dropTargets[FORM_LAYOUT].fieldsIds.filter(id => id !== componentId),
      },
    },
    fields: { ...state.fields },
  };
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'setColumns':
      return { ...state, ...mutateColumns(action.payload, state) };
    case 'setSelectedComponent':
      return { ...state, selectedComponent: action.payload };
    case 'removeComponent':
      return { ...state, ...removeComponent(action.payload, state) };
    default:
      return state;
  }
};

const FormBuilder = () => {
  const [state, dispatch] = useReducer(reducer, initialData);
  const onDragEnd = result => dispatch({ type: 'setColumns', payload: result });
  const { dropTargets, fields, selectedComponent } = state;
  console.log('state', state);
  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      <DragDropContext
        onDragEnd={onDragEnd}
      >
        <div className="layout">
          <DropTarget
            isDropDisabled
            shouldClone
            dropTarget={dropTargets[COMPONENTS_LIST]}
            fields={dropTargets[COMPONENTS_LIST].fieldsIds.map((taskId) => fields[taskId])}
          />
          <DropTarget
            dropTarget={dropTargets[FORM_LAYOUT]}
            fields={dropTargets[FORM_LAYOUT].fieldsIds.map((taskId) => fields[taskId])}
          />
          {selectedComponent && (
            <PropertiesEditor />
          )}
        </div>
      </DragDropContext>
    </StoreContext.Provider>
  );
};

export default FormBuilder;