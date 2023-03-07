const TextSearchAction = ({ unique_key, index ,
                removeComponent , componentList, setComponent,
                sortComponentUp , sortComponentDown }) => {

  const [spinner, setSpinner] = React.useState(false);

  let actiontitle_default= "", actionquery_default ="";
  if (datastory_data.dynamic_elements && datastory_data.dynamic_elements.length) {
    datastory_data.dynamic_elements.forEach(element => {
      if (element.type == 'action' && element.position == index) {
        actiontitle_default = element.action_title ;
        actionquery_default = element.action_query ;
      }
    })
  }

  const [actiontitle, setSearchTitle] = React.useState(actiontitle_default);
  const actiontitleChange = event => { setSearchTitle(event.target.value); };

  const [actionquery, setSearchQuery] = React.useState(actionquery_default);
  const actionqueryChange = event => { setSearchQuery(event.target.value); };


  if (window.location.href.indexOf("/modify/") > -1) {
    try {
      return (
        <div id={index+"__block_field"} className="block_field">
          <div className="ribbon"></div>
          {spinner && (<span id='loader' className='lds-dual-ring overlay'></span>)}
          <h4 className="block_title">Add an action</h4>
          <SortComponent
            index={index}
            sortComponentUp={sortComponentUp}
            sortComponentDown={sortComponentDown}
            key={unique_key} />
          <RemoveComponent
            index={index}
            removeComponent={removeComponent}
            key={unique_key} />
          <div className='form-group'>
            <label htmlFor='largeInput'>Action title</label>
            <input name={index+"__action_title"}
                type='text'
                id={index+"__action_title"}
                onChange={actiontitleChange}
                defaultValue={actiontitle}
                placeholder='The title of the action' required ></input>
            <label htmlFor='largeInput'>SPARQL query</label>
            <textarea name={index+"__action_query"} type='text'
                spellCheck='false'
                onChange={actionqueryChange}
                id={index+"__action_query"}
                defaultValue={actionquery}
                placeholder='A SPARQL query with a placeholder <<item>> for the search term. Return as many variables you like' required>
            </textarea>
            <p><em>Try out the text search to see the action button</em></p>
          </div>
        </div>
      )
    } catch (error) {
      return <ErrorHandler error={error} />
    }
  }
}
