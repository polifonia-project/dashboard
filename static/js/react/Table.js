const Table = ({unique_key, index ,
                removeComponent , componentList, setComponent,
                sortComponentUp , sortComponentDown}) => {

    let title = '' , query = '';
    if (datastory_data.dynamic_elements && datastory_data.dynamic_elements.length) {
      datastory_data.dynamic_elements.forEach(element => {
        if (element.type == 'table' && element.position == index) {
          query = element.table_query ;
          title = element.table_title;
        }
      })
    }

    const [tableTitle, setTitle] = React.useState(title);
    const changeTitle = event => { setTitle(event.target.value)}

    const [tableQuery, setQuery] = React.useState(query);
    const changeQuery = event => { setQuery(event.target.value)}

    const fetchQuery = event => {
      if (tableQuery.length > 1) {
        $('#loader').removeClass('hidden');
        fetch(datastory_data.sparql_endpoint+'?query='+encodeURIComponent(tableQuery),
          {
          method: 'GET',
          headers: { 'Accept': 'application/sparql-results+json' }
          }
        ).then((res) => res.json())
         .then((data) => {
           let tabletoappend = '<tr>';

           var headings = data.head.vars;
           headings.forEach((item, inde) => {
             if (!item.includes('Label')) { tabletoappend += "<th>"+item+"</th>"
             } else {
               headings.splice(inde, 1);  inde--;
             }
           });

           // format table
           tabletoappend += "</tr>";
           //if (returnedJson.length >= 1) {
           data.results.bindings.forEach((item, i) => {
             tabletoappend += "<tr>";
             headings.forEach((head, inde) => {
               var res_value = "";
               if (item[headings[inde]] !== undefined) {
                   res_value = item[headings[inde]].value;
               };

               if (item[headings[inde] + 'Label'] != undefined) {
                 var res_label = "";

                 if (item[headings[inde] + 'Label'].value.length) {
                     res_label = item[headings[inde] + 'Label'].value;
                 }
                 tabletoappend += "<td>";
                 tabletoappend += "<a class='table_result' href='" + res_value + "'>" + res_label + "</a>";
                 // var buttons = addActionButton(actions, headings[j], pos, res_value, res_label);
                 tabletoappend += "</td>";
               }
               else {
                   tabletoappend += "<td>";
                   tabletoappend += "<span class='table_result'>" + res_value + "</span>";
                   // var buttons = addActionButton(actions, headings[j], pos, res_value, res_value);
                   tabletoappend += "</td>";
               }


             });
             tabletoappend += "</tr>";
           });

           $("#" + index + "__table").append(tabletoappend);
           // if (type.length > 0) {
           //     exportTableHtml(pos, type);
           //     exportTableCsv(pos, type, table_title);
           // }
           console.log(tabletoappend);

          })
         .catch((error) => {
            console.error('Error:', error);
            count = "Error!"
         })
         .finally( () => {
           $('#loader').addClass('hidden');
         });

      }
    }

    if (window.location.href.indexOf("/modify/") > -1) {
      return (
      <div id={index+"__block_field"} className="block_field">
        <h4 className="block_title">Add a table</h4>
        <SortComponent
          index={index}
          sortComponentUp={sortComponentUp}
          sortComponentDown={sortComponentDown}
          key={unique_key} />
        <RemoveComponent
          index={index}
          removeComponent={removeComponent}
          key={unique_key} />
        <h3 className="block_title">{tableTitle}</h3>
        <table className='col-12' id={index+'__table'}></table>
        <div className='form-group'>
            <label htmlFor={index+'__table_title'}>Table title</label>
            <input name={index+'__table_title'}
                  type='text'
                  onChange={changeTitle}
                  defaultValue={tableTitle}
                  id={index+'__table_title'}
                  placeholder='The title of the table' required></input>
        </div>
        <div className='form-group'>
            <label htmlFor={index+'__table_query'}>SPARQL query</label>
            <textarea
              spellCheck='false'
              name={index+'__table_query'}
              type='text'
              defaultValue={tableQuery}
              onChange={changeQuery}
              onMouseLeave={fetchQuery}
              id={index+'__table_query'}
              placeholder='A SPARQL returning any value' required></textarea>
        </div>
      </div>

    );

    } else {
      return (
        <table className='col-12' id={index+'__table'}></table>
      )

    }


}
