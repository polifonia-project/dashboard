'use strict';
const e = React.createElement;

// must be a function
const Textbox = () => {
  return <h4>This is a textbox</h4>;
}

const Chart = () => {
  return <h4>This is a chart</h4>;
}

const Table = () => {
  return <h4>This is a table</h4>;
}

const components = [
  {
    name:"textbox",
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


const ButtonGroup = ({ componentBoxes , buttons , addComponent}) => {

  return (
    <>
      <div>{componentBoxes}</div>
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
};

function AddComponent() {
  const [componentList, setComponent] = React.useState([]);
  const componentBoxes = []
  // iterate over the state, push added components to a list
  for (let i = 0; i < componentList.length; i++) {
    const TargetComponent = componentList[i].action;
    componentBoxes.push(<TargetComponent key={i} number={i}/>)
  }

  // change state, add the dictionary of a component
  const addComponent = (buttonLabel) => {
      let comp = components.find(o => o.name === buttonLabel).action;
      // FORGETS THE FIRST ONE??
      setComponent(prevComponents => [
        ...prevComponents, {name:buttonLabel,action:comp}
      ])
  }

  return (
    <>
      <ButtonGroup addComponent={addComponent} buttons={components} componentBoxes={componentBoxes}></ButtonGroup>
    </>
  )
}

const domContainer = document.querySelector('#sortable');
const root = ReactDOM.createRoot(domContainer);
root.render(e(AddComponent));
