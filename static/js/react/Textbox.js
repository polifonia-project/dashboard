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
