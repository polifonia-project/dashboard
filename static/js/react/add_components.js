'use strict';
const e = React.createElement;

// must be a function
const Textbox = ({unique_key, index ,
                  removeComponent , componentList, setComponent ,
                  sortComponentUp , sortComponentDown }) => {

  // WYSIWYG: render empty editor
  React.useEffect(() => {

    const toolbarOptions = () => {
        let toolbarOptions = [];
        toolbarOptions = [
            [{ 'header': [2, 3, false] }],
            ['bold', 'italic', 'underline'],
            ['link'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['clean']
        ]

        return toolbarOptions;
    }

    const fromEditorToInput = (pos) => {
        let editor = document.getElementById(pos + '__editor');
        let qlEditor = editor.childNodes[0];
        let textContent = qlEditor.innerHTML;
        let input = editor.parentNode.querySelector('input');
        input.setAttribute('value', textContent);
        // update content
        editor.onmouseleave = function () {
          textContent = qlEditor.innerHTML;
          input.setAttribute('value', textContent);
        }
    }

    const createTextEditor = () => {
        let quill;
        let editors = document.querySelectorAll('.editor');
        for (const [key, value] of Object.entries(editors)) {
            let pos = value.id.split('__')[0];
            //let name = value.previousElementSibling.id.split('__')[1];
            if (value.children.length != 3) {
                quill = new Quill(value, {
                    modules: { toolbar: toolbarOptions() },
                    theme: 'snow'
                });
            }
            fromEditorToInput(pos);
        }
    }

    createTextEditor();
  });

  // WYSIWYG: show component content
  let content = "";
  if (datastory_data.dynamic_elements && datastory_data.dynamic_elements.length) {
    datastory_data.dynamic_elements.forEach(element => {
      if (element.type == 'text' && element.position == index) {
        content = element.text;
    }})
  }

  function createMarkup() { return {__html: content};}

  // WYSIWYG: render component
  if (window.location.href.indexOf("/modify/") > -1) {
    return (
        <div id={index+"__block_field"} className="block_field">
          <h4 className="block_title">{index}. Add textbox</h4>
          <SortComponent
            index={index}
            sortComponentUp={sortComponentUp}
            sortComponentDown={sortComponentDown}
            key={unique_key} />
          <RemoveComponent
            index={index}
            removeComponent={removeComponent}
            key={unique_key} />

            <input name={index+'__text'} type='hidden' id={index+'__text'} value=''/>
            <div className='editor' id={index+'__editor'} dangerouslySetInnerHTML={createMarkup()}></div>
        </div>
      );
  } else {
    // Final story: render preview
    return (
      <div dangerouslySetInnerHTML={createMarkup()}
          className="typography-line col-md-12 col-sm-12"
          id={index}></div>
    )
  }

}

const Chart = ({ unique_key, index ,
                removeComponent , componentList, setComponent,
                sortComponentUp , sortComponentDown}) => {

    return (
    <div id="{index}__block_field" className="block_field">
      <h4 className="block_title">{index}. This is a chart</h4>
      <SortComponent
        index={index}
        sortComponentUp={sortComponentUp}
        sortComponentDown={sortComponentDown}
        key={unique_key} />
      <RemoveComponent
        index={index}
        removeComponent={removeComponent}
        key={unique_key} />
    </div>
  );

}

const Table = ({unique_key, index ,
                removeComponent , componentList, setComponent,
                sortComponentUp , sortComponentDown}) => {
    return (
    <div id="{index}__block_field" className="block_field">
      <h4 className="block_title">{index}. This is a table</h4>
      <SortComponent
        index={index}
        sortComponentUp={sortComponentUp}
        sortComponentDown={sortComponentDown}
        key={unique_key} />
      <RemoveComponent
        index={index}
        removeComponent={removeComponent}
        key={unique_key} />
    </div>
  );

}

const components = [
  {
    name:"text",
    action: Textbox
  },
  {
    name:"chart",
    action: Chart
  },
  {
    name:"table",
    action: Table
  }
]

const RemoveComponent = ({index , removeComponent }) => {

  return (
    <>
    <a onClick={() => removeComponent(index)}
    href="#" className="trash"><i className="far fa-trash-alt"></i></a><br/>
    </>
  )
}

const SortComponent = ({index , sortComponentDown , sortComponentUp }) => {

  return (
    <>
    <a onClick={() => sortComponentDown(index)}
    href="#" className="down"><i className="fas fa-arrow-down"></i></a>
    <a onClick={() => sortComponentUp(index)}
    href="#" className="up"><i className="fas fa-arrow-up"></i></a>
    </>
  )
}

const ButtonGroup = ({ componentList , componentBoxes , buttons ,
                       addComponent , removeComponent ,
                       sortComponentUp , sortComponentDown}) => {

  if (window.location.href.indexOf("/modify/") > -1) {
    return (
      <>
        <>{componentBoxes}</>
        <section className="addfieldssection col-md-12 col-lg-12 col-sm-12">
        {buttons.map((buttonLabel, i) => (
          <a onClick={() => addComponent(buttonLabel.name)}
              className="btn btn-primary btn-border"
              key={i} name={buttonLabel.name}>
            Add {buttonLabel.name}
          </a>
        ))}
        </section>
      </>
    );
  } else {
    return (<>{componentBoxes}</>)
  }


};

function AddComponent() {

  // retrieve existing components
  const stateComponents = [];
  if (datastory_data.dynamic_elements && datastory_data.dynamic_elements.length) {
    console.log("datastory_data.dynamic_elements",datastory_data.dynamic_elements);
    datastory_data.dynamic_elements.forEach(element => {
      const component_type = element.type ;
      let comp = components.find(o => o.name === component_type);
      stateComponents.push(comp)
    })
  }

  const [componentList, setComponent] = React.useState(stateComponents);
  const componentBoxes = []


  // add a new component
  const addComponent = (buttonLabel) => {
      let comp = components.find(o => o.name === buttonLabel).action;
      setComponent(prevComponents => [
        ...prevComponents, {name:buttonLabel,action:comp}
      ])
      // TODO:ADD TO datastory_data.dynamic_elements
  }

  // remove a component
  const removeComponent = (i) => {
      let newcomponentList = [...componentList];
      newcomponentList.splice(i, 1);
      setComponent(newcomponentList)
      if (datastory_data.dynamic_elements && datastory_data.dynamic_elements.length) {
        datastory_data.dynamic_elements.splice(i, 1);
        datastory_data.dynamic_elements = datastory_data.dynamic_elements.map((item, index) =>  { delete item['position']; return {"position" :index, ...item} } )
      }
  }

  // move up a component
  const sortComponentUp = (i) => {
    let newcomponentList = [...componentList];
    let cutOut = newcomponentList.splice(i, 1) [0];
    let new_i = (i === 0) ? 0: i-1; // cut the element at index 'i'
    newcomponentList.splice(new_i, 0, cutOut); // insert it at index 'new_i'
    setComponent(newcomponentList)
    if (datastory_data.dynamic_elements && datastory_data.dynamic_elements.length) {
      let cutOut = datastory_data.dynamic_elements.splice(i, 1) [0];
      datastory_data.dynamic_elements.splice(new_i, 0, cutOut);
      datastory_data.dynamic_elements = datastory_data.dynamic_elements.map((item, index) =>  { delete item['position']; return {"position" :index, ...item} } )
    }
  }

  // move down a component
  const sortComponentDown = (i) => {
    let newcomponentList = [...componentList];
    let cutOut = newcomponentList.splice(i, 1) [0];
    let new_i = i+1; // cut the element at index 'from'
    newcomponentList.splice(new_i, 0, cutOut); // insert it at index 'to'
    setComponent(newcomponentList)
    if (datastory_data.dynamic_elements && datastory_data.dynamic_elements.length) {
      let cutOut = datastory_data.dynamic_elements.splice(i, 1) [0];
      datastory_data.dynamic_elements.splice(new_i, 0, cutOut);
      datastory_data.dynamic_elements = datastory_data.dynamic_elements.map((item, index) =>  { delete item['position']; return {"position" :index, ...item} } )
    }
  }

  const generateKey = (pre) => {
      return `${ pre }_${ new Date().getTime() }`;
  }

  // push new and old components to a list and render
  for (let i = 0; i < componentList.length; i++) {
    const TargetComponent = componentList[i].action;
    componentBoxes.push(<TargetComponent
        removeComponent={removeComponent}
        sortComponentUp={sortComponentUp}
        sortComponentDown={sortComponentDown}
        index={i} key={generateKey(componentList[i].name)+i} number={i}/>)
  }

  console.log("componentList",componentList);
  console.log("componentBoxes",componentBoxes);

  return (
    <>
      <ButtonGroup
        componentList={componentList}
        addComponent={addComponent}
        removeComponent={removeComponent}
        sortComponentUp={sortComponentUp}
        sortComponentDown={sortComponentDown}
        buttons={components}
        componentBoxes={componentBoxes}></ButtonGroup>
    </>
  )
}

const domContainer = document.querySelector('#sortable');
const root = ReactDOM.createRoot(domContainer);
root.render(e(AddComponent));
