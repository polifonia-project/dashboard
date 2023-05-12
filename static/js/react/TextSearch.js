function update_config() {
  const form = document.getElementById('modifystory_form');
  if (form) {
    const timer = setTimeout(() => {datastory_data = update_datastory(form)}, 1000);
    return () => {clearTimeout(timer);};
  }
}

// get cell value
function get_cell_value(headings, head, inde, item) {
  let tableresults = '',
      res_label,
      res_value = item[headings[inde]].value;

  if (item[headings[inde] + 'Label'] != undefined) {
    res_label = "";
    if (item[headings[inde] + 'Label'].value.length) {
        res_label = item[headings[inde] + 'Label'].value;
    }

    // audio
    if (res_value.endsWith('.mp3')) {
      tableresults += "<span>"+res_label+"</span><audio class='table_result'><source src='" + res_value + "'></source></audio>";
    }
    // img
    else if (res_value.endsWith('.jpg') || res_value.endsWith('.png')) {
      tableresults += "<span>"+res_label+"</span><img class='img_table' src='" + res_value + "'/>";
    }
    // video
    else if (res_value.endsWith('.mp4') || res_value.endsWith('.ogg')) {
      tableresults += "<span>"+res_label+"</span><video controls class='table_result'><source src='" + res_value + "'></source></video>";
    }
    // youtube
    else if (res_value.includes("youtube.com/embed/")) {
      tableresults += '<span>'+res_label+'</span><div id=embed-google-map style="height:100%; width:100%;max-width:100%;"><iframe allowFullScreen="allowFullScreen" src="'+res_value+'?ecver=1&amp;iv_load_policy=1&amp;rel=0&amp;yt:stretch=16:9&amp;autohide=1&amp;color=red&amp;width=186&amp;width=186" width="186" height="105" allowtransparency="true" frameborder="0"></iframe>';
    }
    // URL
    else {
      tableresults += "<a class='table_result' href='" + res_value + "'>" + res_label + "</a>";
    }
  }
  else {
      if (res_value.endsWith('.mp3')) {
        tableresults += "<audio controls src='" + res_value + "' class='table_result'><a href='" + res_value + "'></a></audio>";
      }
      else if (res_value.endsWith('.jpg') || res_value.endsWith('.png')) {
        tableresults += "<img class='img_table' src='" + res_value + "'/>";
      }
      else if (res_value.endsWith('.mp4') || res_value.endsWith('.ogg')) {
        tableresults += "<video controls class='table_result'><source src='" + res_value + "'></source></video>";
      }
      else if (res_value.includes("youtube.com/embed/")) {
        tableresults += '<div id=embed-google-map style="height:100%; width:100%;max-width:100%;"><iframe allowFullScreen="allowFullScreen" src="'+res_value+'?ecver=1&amp;iv_load_policy=1&amp;rel=0&amp;yt:stretch=16:9&amp;autohide=1&amp;color=red&amp;width=186&amp;width=186" width="186" height="105" allowtransparency="true" frameborder="0"></iframe>';
      }
      else {
        tableresults += "<span class='table_result'>" + res_value + "</span>";
      }
  }
  return tableresults
}

function export_html(id_el) {
  let table = document.getElementById(id_el);
  let cloneTable = table.cloneNode(true);
  cloneTable.querySelector('.caret').remove();
  cloneTable.querySelector('.closetable').remove();
  cloneTable.querySelector('tfoot').remove();
  let tableHtml = cloneTable.innerHTML;
  window.prompt("Copy to clipboard: Ctrl+C, Enter", '<table>' + tableHtml + '</table>');
};

// export table as csv
function createCsv(table, separator = ',') {
    // Select rows from table_id
    var rows = table.rows, csv = [];
    for (var i = 0; i < rows.length; i++) {
        var row = [], cols = rows[i].querySelectorAll('td, th');
        for (var j = 0; j < cols.length; j++) {
            // Clean innertext to remove multiple spaces and jumpline (break csv)
            if (cols[j].querySelector("input") != null) {
              let input_val = cols[j].querySelector("input");
              var data = input_val.value.replace(/(\r\n|\n|\r)/gm, '').replace(/(\s\s)/gm, ' ').trim();
            } else if ( cols[j].querySelector("audio") != null) {
              var data = cols[j].querySelector("audio").getAttribute('src')
            } else if ( cols[j].querySelector("img") != null) {
              var data = cols[j].querySelector("img").getAttribute('src')
            } else {
              var data = cols[j].innerText.replace(/(\r\n|\n|\r)/gm, '').replace(/(\s\s)/gm, ' ').trim();
            }
            // Escape double-quote with double-double-quote (see https://stackoverflow.com/questions/17808511/properly-escape-a-double-quote-in-csv)
            data = data.replace(/"/g, '""');
            // Push escaped string
            row.push('"' + data + '"');
        }
        csv.push(row.join(separator));
    }
    return csv;
}

function export_csv(id_el,id_btn) {
  let table = document.getElementById(id_el);
  let export_btn = document.getElementById(id_btn);
  let cloneTable = table.cloneNode(true);
  cloneTable.querySelector('.caret').remove();
  cloneTable.querySelector('.closetable').remove();
  cloneTable.querySelector('tfoot').remove();
  let tableCSV = createCsv(cloneTable);
  var csv_string = tableCSV.join('\n');
  export_btn.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv_string));
};

function edit_table(id_el) {
  let table = document.getElementById(id_el);
  let thead = table.querySelectorAll("thead tr")[0]
  let tbody = table.querySelectorAll("tbody tr")
  let th = document.createElement('th');
  th.textContent = 'Notes';
  thead.appendChild(th);

  for (let tr of tbody) {
    let td = document.createElement('td');
    let input_note = document.createElement('input');
    td.appendChild(input_note);
    tr.appendChild(td);
  }
};

function extractContent(html) {
  return new DOMParser()
      .parseFromString(html, "text/html")
      .documentElement.textContent;
};

const ActionTable = ({unique_key,indexTextsearch,buttonLabel,
  cell_value,queryResults,
  actionComponents,setActionComponent,
  all_actions,setAction,actions}) => {

  let empty, headers = [];
  let index = Date.now();
  let headings = queryResults.head.vars;
  headings.forEach((item, inde) => { if (!item.includes('Label')) { headers.push(item);}});
  headings.forEach((item, inde) => {
    if (item.includes('Label')) { headings.splice(inde, 1); inde--;}
  });

  const [tableactions, setTableActions] = React.useState(actions);

  // toggle table
  const [toggle, setToggle] = React.useState(true);
  const collapse_table = () => { setToggle(!toggle);};
  // detach table
  const [tablecontent, setEmpty] = React.useState(queryResults);
  const detach_table = event => { setEmpty(empty);}
  // show action buttons in table headers
  const [showActionListTable,setVisibilityActionsList] = React.useState(false);
  const showActions = () => { setVisibilityActionsList(!showActionListTable) }

  function createMarkup() { return {__html: cell_value};}

  let finalpreview;
  if (window.location.href.indexOf("/modify/") == -1) {finalpreview = true};

  try {
    return (
      <>
      {tablecontent ?
        <table className='col-12 actionresults' id={index+"__actionresults"}>
          <caption
            id={"actionresults_caption_"+index}
            className="resulttable_caption">{buttonLabel}: <em><span dangerouslySetInnerHTML={createMarkup()}></span></em>
            <span className="caret" onClick={collapse_table}></span>
            <span className="closetable" onClick={detach_table}>x</span>
          </caption>
          {toggle ?
            <>
              <thead>
                <tr>{headers.map((heading, i) => (
                  <th key={heading}>{heading}
                  {!finalpreview && all_actions.length > 0 && (
                      <span className="add_action" onClick={showActions}>+</span>
                    )}
                    {!finalpreview && showActionListTable ?
                      <><ColumnListActions
                          index={indexTextsearch}
                          key={index+heading+'actiontable_actionlist'}
                          column_name={heading}
                          all_actions={all_actions}
                          actions={actions}
                          setAction={setAction}
                          setTableActions={setTableActions}
                          tableactions={tableactions}/>
                  </>: <></>}
                  </th>)
                )}</tr>
              </thead>
              <tbody>
              {queryResults.results.bindings.map((item, i) => (
                <tr key={item+i}>
                  {headers.map((head, inde) => (
                    <td key={head+inde}>
                      <span key={head+inde+item+i} dangerouslySetInnerHTML=
                        {{ __html: get_cell_value(headers,head,inde,item)}}>
                      </span>
                      {tableactions[headers[inde]] && tableactions[headers[inde]].map((el, i) => (
                          <ActionButton
                            key={head+inde+index+'button_action'+item+i+el}
                            unique_key={head+inde+index+'button_action'+item+i+el}
                            indexTextsearch={indexTextsearch}
                            buttonLabel={el}
                            cell_value={get_cell_value(headers,head,inde,item)}
                            actionComponents={actionComponents}
                            setActionComponent={setActionComponent}
                            all_actions={all_actions}
                            setAction={setAction}
                            actions={actions}/>
                        ))}

                    </td>
                  ))}
                </tr>
              ))}
              </tbody>
            </>
            : <></>
          }
        </table>
        : <></>}
      </>
    )
  }
  catch (error) {
    console.log(error);
    return <ErrorHandler error={error} />
  }

  // END ActionTable
}


const ActionButton = ({unique_key,indexTextsearch,buttonLabel,cell_value,
  actionComponents,setActionComponent,
  showActionList,setVisibilityActions,
  all_actions,setAction,actions}) => {

  let action_query = '', action_type, headers = [];
  if (datastory_data.dynamic_elements && datastory_data.dynamic_elements.length) {
    datastory_data.dynamic_elements.forEach(element => {
      if (element.type == 'action' && element.action_title == buttonLabel) {
        action_query = element.action_query;
      }
    })
  }

  let actionresults;
  const [actionQueryResults, setActionQueryResults] = React.useState(actionresults);
  const [spinner, setSpinner] = React.useState(false);


  const performAction = () => {
    if (action_query.length) {
      // default behaviour, create a table
      if (!action_type || action_type == 'table') {
        // modify query, replace placeholder with cell value
        let queryString, data = [];
        if (!cell_value.includes('href')) {queryString = cell_value}
        else {
          let q = document.createElement('p');
          q.innerHTML = cell_value;
          queryString = q.firstElementChild.getAttribute('href');
        };

        // perform SPARQL query
        if (action_query.length > 1) {
          setSpinner(true);
          // replace queryString in query
          let textsearch_query;
          if (!cell_value.includes('href')) {
            if (!queryString.includes('http'))
              {textsearch_query = action_query.replace('<<item>>', '\"'+queryString+'\"');}
            else {
              textsearch_query = action_query.replace('<<item>>', '<'+extractContent(queryString)+'>');}
          } else {
            textsearch_query = action_query.replace('<<item>>', '<'+queryString+'>');
          }

          fetch(datastory_data.sparql_endpoint+'?query='+encodeURIComponent(textsearch_query),
            {
            method: 'GET',
            headers: { 'Accept': 'application/sparql-results+json' }
            }
          ).then((res) => res.json())
           .then((data) => {
             setSpinner(false);
             setActionQueryResults(data);
             // create table component
             let updated_action_results = [...actionComponents]
             let action_result_component = <ActionTable
                       key={cell_value+action_query+'action_table'}
                       unique_key={cell_value+action_query+'action_table'}
                       indexTextsearch={indexTextsearch}
                       buttonLabel={buttonLabel}
                       cell_value={cell_value}
                       queryResults={data}
                       actionComponents={actionComponents}
                       setActionComponent={setActionComponent}
                       actionQueryResults={data}
                       all_actions={all_actions}
                       setAction={setAction}
                       actions={actions}/>;
             // push component in the array visualised after TextSearchResults
             updated_action_results = [...actionComponents,action_result_component]
             setActionComponent(updated_action_results)
            })
           .catch((error) => {
              console.error('Error:', error); alert("Action ",error);
              setSpinner(false);
           });
        }
        else {console.log("no query");}
      }
    }
  };

  return (
    <span
      key={unique_key}
      className='action_button'
      onClick={performAction}>
      {buttonLabel}
    </span>
  )
  // END ActionButton
}


const ColumnListActions = ({index,column_name,
  all_actions,actions,setAction,setTableActions,tableactions}) => {

  // pick the actions that have been selected for the column at hand
  let actions_column = [];
  // if (datastory_data.dynamic_elements && datastory_data.dynamic_elements.length) {
  //   datastory_data.dynamic_elements.forEach(element => {
  //     if (element.type == 'textsearch' && element.position == index) {
  //       if (element.textsearch) {
  //         saved_actions = element.textsearch
  //       }
  //       // if (element.textsearch[column_name]) {
  //       //   actions_column = element.textsearch[column_name]
  //       // }
  //     }
  //   })
  // }
  if (tableactions) {
    if ([column_name] in tableactions) { actions_column = tableactions[column_name];}
  } else {
    if ([column_name] in actions) { actions_column = actions[column_name];}
  }
  //if ([column_name] in actions) { actions_column = actions[column_name];}
  const [isActive, setActive] = React.useState(actions_column);
  // get class of active actions
  const cx = (...list) => list.filter(Boolean).join(' ');

  // update actions when the user selects an action


  const addToActive = (elem) => {
    var updatedActive = [...isActive];
    let updatedColActions = {}, saved_actions = {};
    if (datastory_data.dynamic_elements && datastory_data.dynamic_elements.length) {
      datastory_data.dynamic_elements.forEach(element => {
        if (element.type == 'textsearch' && element.position == index) {
          if (element.textsearch) { saved_actions = element.textsearch}
        }
      })
    }
    updatedColActions = {...saved_actions};
    console.log("saved_actions",saved_actions);
    // on click, if the array already includes the action name, remove or add it
    if (updatedActive.includes(elem[0])) {
      updatedActive.splice(updatedActive.indexOf(elem[0]), 1);
      console.log("remove:",elem[0]);
      console.log("updatedActive:",updatedActive);
    } else {
      updatedActive.push(elem[0]);
      console.log("add:",elem[0]);
      console.log("updatedActive:",updatedActive);
    }
    setActive(updatedActive);
    updatedColActions = {...saved_actions, [column_name]:updatedActive }
    setAction(updatedColActions);
    update_config();
    if (setTableActions) {
      setTableActions(updatedColActions)
    }
  }

  try {
    return (
    <span key={index+'_action_group_'+column_name}>
      {all_actions.map((el,j) => (
        <span key={index+'_action_group_'+column_name+j}>
        <input
          type="button"
          id={index+'__textsearch_column__'+column_name+'__action__'+el[2]}
          name={index+'__textsearch_column__'+column_name+'__action__'+el[2]}
          className={cx('action_button', (isActive.includes(el[0])) && 'active_action')}
          key={column_name+index+j+'action'+el}
          defaultValue={el[0]}
          onClick={() => {addToActive(el)}}></input>
        </span>
        )
      )}
    </span>
  )
  } catch (error) { return <ErrorHandler error={error} /> }

  // END ColumnListActions
}


const TextSearchResults = ({ index,
  queryResults,queryString,setResults,
  all_actions,actions,setAction,
  actionComponents,setActionComponent }) => {

  // show actions in columns if any
  const [showActionList,setVisibilityActions] = React.useState(false);
  const showActions = () => { setVisibilityActions(!showActionList) }

  // buttons in the footer of the table
  let empty, finalpreview ;
  if (window.location.href.indexOf("/modify/") == -1) {finalpreview = true};
  const detach_table = event => { setResults(empty); }
  const [toggle, setToggle] = React.useState(true);
  const collapse_table = () => { setToggle(!toggle);};

  var tableresults = '';
  let headers = [];
  var headings = queryResults.head.vars;
  headings.forEach((item, inde) => { if (!item.includes('Label')) { headers.push(item);}});
  headings.forEach((item, inde) => {
    if (item.includes('Label')) { headings.splice(inde, 1); inde--;}
  });
  // render
  try {
    return (
    <table className='col-12 textsearchresults' id={index+"__textsearchresults"}>
      <caption
        id={"textsearchresults_caption_"+index}
        className="resulttable_caption">You searched for: <em>{queryString}</em>
        <span className="caret" onClick={collapse_table}></span>
        <span className="closetable" onClick={detach_table}>x</span>
      </caption>
      {toggle ?
        <>
        <thead>
          <tr>{headers.map((heading, i) => (
            <th key={heading}>{heading}
            {!finalpreview && all_actions.length > 0 && (
                <span className="add_action" onClick={showActions}>+</span>
              )}
              {!finalpreview && showActionList ?

                  <ColumnListActions
                      index={index}
                      key={index+heading+'actionlist'}
                      column_name={heading}
                      all_actions={all_actions}
                      actions={actions}
                      setAction={setAction}
                      setTableActions={empty}
                      tableactions={empty}/>

                : <></>}
            </th>)
          )}</tr>
        </thead>
        <tbody>
        {queryResults.results.bindings.map((item, i) => (
          <tr key={item+i}>
            {headers.map((head, inde) => (
              <td key={head+inde}>
                <span key={head+inde+item+i} dangerouslySetInnerHTML=
                  {{ __html: get_cell_value(headers,head,inde,item)}}>
                </span>

                {actions[headers[inde]] && actions[headers[inde]].map((el, i) => (
                    <ActionButton
                      key={head+inde+'button'+item+i+el}
                      unique_key={head+inde+item+i+el}
                      indexTextsearch={index}
                      buttonLabel={el}
                      cell_value={get_cell_value(headers,head,inde,item)}
                      actionComponents={actionComponents}
                      setActionComponent={setActionComponent}
                      all_actions={all_actions}
                      setAction={setAction}
                      actions={actions}/>
                  ))}

              </td>
            ))}
          </tr>
        ))}
        </tbody>
        <tfoot>
          <tr>
            <td>
              <a id={index+"__export_html"}
                className="btn btn-info btn-border btn-round btn-sm mr-2"
                onClick={() => {export_html(index+"__textsearchresults")}}>Embed</a>
              <a id={index+"__export_csv"}
                target='_blank'
                download={'export_'+index+'.csv'}
                className="btn btn-info btn-border btn-round btn-sm mr-2"
                onClick={() => {export_csv(index+"__textsearchresults", index+"__export_csv")}}>CSV</a>
                {finalpreview &&
                <a id={index+"__edit_table"}
                  className="btn btn-info btn-border btn-round btn-sm mr-2"
                  onClick={() => {edit_table(index+"__textsearchresults")}}>Edit</a>
                }
            </td>
          </tr>
        </tfoot>
        </>
        :
          <></>
      }
    </table>
  )
  } catch (error) { return <ErrorHandler error={error} /> }

  // END TextSearchResults
  }


// text search component box
const TextSearch = ({ unique_key, index ,
  removeComponent , componentList, setComponent,
  sortComponentUp , sortComponentDown}) => {

    let title_search = '',
        sparql_query = '',
        results_table,
        all_actions = [],
        all_actions_titles = [],
        saved_actions = {};

    // WYSIWYG: get title, query and actions (default and selected) if any
    if (datastory_data.dynamic_elements && datastory_data.dynamic_elements.length) {
      datastory_data.dynamic_elements.forEach(element => {
        if (element.type == 'textsearch' && element.position == index) {
          title_search = element.textsearch_title ;
          sparql_query = element.textsearch_query ;
          if (element.textsearch) { saved_actions = element.textsearch}
        }
        if (element.type == 'action') {
          all_actions.push([element.action_title, element.action_query, element.position])
          all_actions_titles.push(element.action_title)
        }
      })
    }
    // update list of actions attached to columns on click
    const [actions, setAction] = React.useState(saved_actions);

    const [title, setSearchTitle] = React.useState(title_search);
    const titleChange = event => { setSearchTitle(event.target.value); };

    const [query, setSearchQuery] = React.useState(sparql_query);
    const queryChange = event => { setSearchQuery(event.target.value); };

    const [queryString, setQueryString] = React.useState('');
    const updateQueryString = event => { setQueryString(event.target.value); };

    const [queryResults, setResults] = React.useState(results_table);
    const [spinner, setSpinner] = React.useState(false);

    const [queryvars,setqueryvars] = React.useState([]);

    // add action results (tables, benchmarks, etc) to a list of components
    const [actionComponents,setActionComponent] = React.useState([]);

    // perform the text search and sends data to the TextSearchResults component
    const fetchTextquery = (event) => {
      if (query.length > 1) {
        setSpinner(true);
        // replace queryString in query
        const textsearch_query = query.replace('<<searchterm>>', '\"'+queryString+'\"');
        fetch(datastory_data.sparql_endpoint+'?query='+encodeURIComponent(textsearch_query),
          {
          method: 'GET',
          headers: { 'Accept': 'application/sparql-results+json' }
          }
        ).then((res) => res.json())
         .then((data) => {
           setSpinner(false);
           setResults(data);
          })
         .catch((error) => {
            console.error('Error:', error);
            alert("Text search: there is an error in the query");
            setSpinner(false);
         });
      } else {console.log("no query");}
    }

    // update checkbox label if changes in the action box
    React.useEffect(() => {
      try {
        // update default actions if action components are deleted
        if (datastory_data.dynamic_elements && datastory_data.dynamic_elements.length) {
          all_actions = [];
          datastory_data.dynamic_elements.forEach(element => {
            if (element.type == 'action') {
              all_actions.push([element.action_title, element.action_query, element.position])
            }
          })
        }
        // check if any action component has been deleted, and remove it from saved_actions
        Object.entries(saved_actions).map( ([col, list_actions]) => {
          list_actions.forEach((el, i) => {
            if (!all_actions_titles.includes(el)) {
              list_actions.splice(i, 1);
              setAction(saved_actions);
              update_config();
            }
          });
        });
        //setActionResult(actionResults)
      } catch (error){console.log(error);}
    });

    // render component WYSIWYG and preview
    if (window.location.href.indexOf("/modify/") > -1) {
      try {
      return (
        <div id={index+"__block_field"} className="block_field">
          {spinner && (<span id='loader' className='lds-dual-ring overlay'></span>)}
          <div className="ribbon"></div>
          <h4 className="block_title">Add a text search</h4>
          <SortComponent
            index={index}
            sortComponentUp={sortComponentUp}
            sortComponentDown={sortComponentDown}
            key={unique_key} />
          <RemoveComponent
            index={index}
            removeComponent={removeComponent}
            key={unique_key} />
          <div className="previewtextsearch row">
            <h3 className="block_title col-12">{title}</h3>
            <input className='textsearch_userinput modifydatastory col-8'
              id={index+"__textsearch_userinput"}
              type='text'
              onChange={updateQueryString}
              name={index+"__textsearch_userinput"}></input>
            <a id={index+"__textsearch_button"}
              className='textsearch_button col-3'
              onClick={fetchTextquery}>Search</a>
            <a className="col-12"
              href='#' role='button'
              data-toggle='modal' data-target='#textModalLong'>Learn more about text searches and actions</a>
            {queryResults &&
              (<TextSearchResults
               key={"results_"+unique_key+index+Date.now()}
               index={index}
               queryResults={queryResults}
               queryString={queryString}
               setResults={setResults}
               all_actions={all_actions}
               actions={actions}
               setAction={setAction}
               actionComponents={actionComponents}
               setActionComponent={setActionComponent}/>
              )}
          </div>
          <>{actionComponents}</>
          <div className='form-group'>
            <label htmlFor='largeInput'>Search title</label>
            <input name={index+"__textsearch_title"}
                type='text'
                id={index+"__textsearch_title"}
                onChange={titleChange}
                defaultValue={title}
                placeholder='The title of the text search' required ></input>
            <label htmlFor='largeInput'>SPARQL query</label>
            <textarea name={index+"__textsearch_query"} type='text'
                spellCheck='false'
                onChange={queryChange}
                id={index+"__textsearch_query"}
                defaultValue={query}
                placeholder='A SPARQL query with a placeholder <<searchterm>> for the search term. Return as many variables you like' required>
            </textarea>
            <p><em>Try out the text search to run the query</em></p>

          </div>
          <div className="modal fade"
              id="textModalLong"
              tabIndex="-1" role="dialog"
              aria-labelledby="textModalLongTitle"
              aria-hidden="true">
              <div className="modal-dialog modal-lg" role="document">
                  <div className="modal-content card">
                      <div className="modal-header">
                          <h4 id="textModalLongTitle" className="card-title">
                          Perform text searches and explore graphs with actions</h4>
                      </div>
                      <div className="modal-body">
                          <div className="container">
                              <div className="row">
                                  <p>A SPARQL query to create a text search allows you
                                  to return any data relevant to a query string in tabular form.
                                  It requires you to include the following placeholder (names are mandatory).</p>
                                  <ul>
                                      <li><strong>&lt;&lt;searchterm&gt;&gt;</strong>: a placeholder for the string to be searched.</li>

                                  </ul>
                                  <p>You can add as many other variables as you like.
                                  Values will be shown in a table as columns. The same constraints and properties of normal tables
                                  apply to results (e.g. simplified labels, export in HTML/CSV, addition of editable columns in the the final story)</p>
                                  <p>For instance, a query to ArCO to retrieve cultural heritage objects including a string in their label would look like follows:</p>
                                  <code className="query-eg">{"SELECT DISTINCT ?var ?varLabel ?class ?classLabel"}<br/>
                                  {"WHERE {"}<br/>
                                  {"?var rdf:type arco:DemoEthnoAnthropologicalHeritage; "}<br/>
                                  {"rdfs:label ?varLabel; a ?class . ?class rdfs:label ?classLabel ."}<br/>
                                  {"FILTER regex(str(?varLabel), <<searchterm>>, 'i') "}<br/>
                                  {"FILTER (lang(?classLabel) = 'it')"}<br/>
                                  {"} LIMIT 15"}<br/></code>
                              </div>
                              <div className="row">
                                <h3>Add actions to tables</h3>
                                  <p>Once you have created a text search, you can add actions to table results.
                                  To create an action you must write a SPARQL query
                                  that references an entity value in an existing table
                                  (e.g. the value of column <code>?var</code>
                                  in the previous textsearch) and generates a new table.
                                  The SPARQL query of an action can return as many variables as you like.
                                  The only requirement for the SPARQL query is the following placeholder:
                                  </p>
                                  <ul>
                                      <li><strong>&lt;&lt;item&gt;&gt;</strong>: a placeholder for the entity to which the action is attached. It can be a placeholder for a URI or a string (in this case, you must enquote the placeholder)</li>
                                  </ul>
                                  <p>Actions appear as buttons in the selected column.
                                  Multiple actions can be attached to the same column, and multiple columns may have different (or the same) actions.
                                  Lastly, actions can be reused in any new table, whether this is the table resulting from a text search
                                  or one of the following tables created by actions.</p>
                                  <p><strong>Be aware</strong> that actions are attached to column names (i.e. SPARQL variables), regardless of the table they belong to. Therefore: <strong>action names and column names must be unique</strong>.</p>
                              </div>
                          </div>
                      </div>
                      <div className="modal-footer">
                          <button type="button" className="btn btn-danger"
                              data-dismiss="modal">Close</button>
                      </div>
                  </div>
              </div>
          </div>
          {Object.entries(actions).map(([column_name, action_list]) => (
            action_list.map((el,j) => (
              <input
                type="hidden"
                id={index+'__textsearch_col_'+column_name+'_action_'+j}
                name={index+'__textsearch_col_'+column_name+'_action_'+j}
                key={index+'hiddenaction'+j}
                defaultValue={actions[column_name].indexOf(el) > -1 && el}>
              </input>
            ))
          ))}
        </div> )
      } catch (error) {
        return <ErrorHandler error={error} />
      }
    } else {
    // Final story: render preview
    try {
      return (
      <>
          {spinner && (<span id='loader' className='lds-dual-ring overlay'></span>)}
          <h3 className="block_title">{title}</h3>
          <div className="row finaltextsearch">
            <input className='textsearch_userinput modifydatastory col-6'
              id={index+"__textsearch_userinput"}
              type='text'
              onChange={updateQueryString}
              name={index+"__textsearch_userinput"}></input>
            <a id={index+"__textsearch_button"}
              className='textsearch_button col-3'
              onClick={fetchTextquery}>Search</a>
          </div>
          {queryResults &&
            (<><TextSearchResults
             index={index}
             key={"results_"+unique_key+index+Date.now()}
             queryResults={queryResults}
             queryString={queryString}
             setResults={setResults}
             all_actions={all_actions}
             actions={actions}
             setAction={setAction}
             actionComponents={actionComponents}
             setActionComponent={setActionComponent}
             />
             {actionComponents}</>
           )}

      </>
    )} catch (error) { return <ErrorHandler error={error} /> }
  }
  // END TextSearch
  }
