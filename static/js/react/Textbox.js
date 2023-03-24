// text editor component box
const Textbox = ({unique_key, index ,
                  removeComponent , componentList, setComponent ,
                  sortComponentUp , sortComponentDown }) => {

  // WYSIWYG: render editor
  React.useEffect(() => {
    let form = document.getElementById('modifystory_form');
    try {
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

    // move edited text from editor to hidden input
    const fromEditorToInput = (pos) => {
        let editor = document.getElementById(pos + '__editor');
        let qlEditor = editor.childNodes[0];
        let textContent = qlEditor.innerHTML;
        if (textContent) {
          let input = editor.parentNode.querySelector('input');
          input.setAttribute('value', textContent);
          // update content
          editor.addEventListener("keyup", (event) => {
            const timer = setTimeout(() => {
              textContent = qlEditor.innerHTML;
              input.setAttribute('value', textContent);
              datastory_data = update_datastory(form)
            }, 2000);
            return () => {clearTimeout(timer); console.log(timer);};
          });
        }
    }

    const createTextEditor = () => {
      let quill;
      let editors = document.querySelectorAll('.editor');
      for (const [key, value] of Object.entries(editors)) {
          let pos = value.id.split('__')[0];
          let name = value.previousElementSibling.id.split('__')[1];
          if (pos == index) {
              quill = new Quill(value, {
                  modules: {
                      toolbar: toolbarOptions()
                  },
                  theme: 'snow'
              });
          }
          fromEditorToInput(pos);
      }
  }

    createTextEditor();
    } catch (error) { <ErrorHandler error={error} /> }
  });

  // WYSIWYG: get text content if any
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
    try {
      return (
        <div id={index+"__block_field"} className="block_field">
          <div className="ribbon"></div>
          <h4 className="block_title">Add a textbox</h4>
          <SortComponent
            index={index}
            sortComponentUp={sortComponentUp}
            sortComponentDown={sortComponentDown}
            key={unique_key} />
          <RemoveComponent
            index={index}
            removeComponent={removeComponent}
            key={unique_key} />

          <input name={index+'__text'}
              type='hidden' id={index+'__text'}
              defaultValue={<>createMarkup()</>}/>
          <div className='editor'
              id={index+'__editor'}
              dangerouslySetInnerHTML={createMarkup()}></div>
        </div>
      );
    } catch (error) { return <ErrorHandler error={error} /> }
  } else {
    // Final story: render preview
    try {
      return (
      <div dangerouslySetInnerHTML={createMarkup()}
          className="typography-line col-md-12 col-sm-12"
          id={index}></div>
    );
    } catch (error) { return <ErrorHandler error={error} /> }
  }

}
