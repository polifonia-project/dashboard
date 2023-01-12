const Table = ({unique_key, index ,
                removeComponent , componentList, setComponent,
                sortComponentUp , sortComponentDown}) => {

    let title = '' , query = '', tabletoappend;
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
           tabletoappend = '<tr>';

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

    function exportTableHtml(position, type) {
        var export_btn;
        var tableHtml;
        if (type && type.includes('table')) {
            export_btn = document.getElementById('export_' + position);
            var table = document.getElementById(position + '__table');
            var cloneTable = table.cloneNode(true);
            tableHtml = cloneTable.innerHTML;
        } else if (type && type.includes('textsearch')) {
            export_btn = document.getElementById('export_' + position);
            table = document.getElementById(position + '__textsearchid');
            var cloneTable = table.cloneNode(true);
            cloneTable.getElementsByTagName('caption')[0].removeAttribute('style');
            // remove action buttons
            var uselessEl = cloneTable.querySelectorAll('.action_button');
            uselessEl.forEach(el => { el.remove(); })
            // remove span buttons
            cloneTable.querySelector('.caret').remove();
            cloneTable.querySelector('.closetable').remove();
            cloneTable.querySelector('#export_' + position).remove();
            tableHtml = cloneTable.innerHTML;
        }

        window.prompt("Copy to clipboard: Ctrl+C, Enter", '<table>' + tableHtml + '</table>');

    }

    function exportTableCsv(position, type) {
        var export_btn = document.getElementById('csv_' + position);
        var table_id = '';
        var csv = [];
        if (type && type.includes('table')) {
            table_id = position + '__table';
            var table = document.getElementById(table_id);
            var cloneTable = table.cloneNode(true);
            csv = createCsv(cloneTable);
        } else if (type && type.includes('textsearch')) {
            table_id = position + '__textsearchid';
            var cloneTable = table.cloneNode(true);
            cloneTable.getElementsByTagName('caption')[0].removeAttribute('style');
            // remove action buttons
            var uselessEl = cloneTable.querySelectorAll('.action_button');
            uselessEl.forEach(el => {
                el.remove();
            })
            // remove span buttons
            cloneTable.querySelector('.caret').remove();
            cloneTable.querySelector('.closetable').remove();
            cloneTable.querySelector('#export_' + position).remove();
            csv = createCsv(cloneTable);
        }

        var csv_string = csv.join('\n');
        var filename = 'export.csv';
        export_btn.setAttribute('target', '_blank');
        export_btn.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv_string));
        export_btn.setAttribute('download', filename);

    }

    // construct csv
    function createCsv(table, separator = ',') {
        // Select rows from table_id
        var rows = table.rows;
        // Construct csv
        var csv = [];
        for (var i = 0; i < rows.length; i++) {
            var row = [], cols = rows[i].querySelectorAll('td, th');
            for (var j = 0; j < cols.length; j++) {
                // Clean innertext to remove multiple spaces and jumpline (break csv)
                var data = cols[j].innerText.replace(/(\r\n|\n|\r)/gm, '').replace(/(\s\s)/gm, ' ').trim();
                // Escape double-quote with double-double-quote (see https://stackoverflow.com/questions/17808511/properly-escape-a-double-quote-in-csv)
                data = data.replace(/"/g, '""');
                // Push escaped string
                row.push('"' + data + '"');
            }
            csv.push(row.join(separator));
        }
        return csv;
    }


    // preview counter
    React.useEffect(() => {
       fetchQuery();
    }, []);

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
      function createMarkup() { return {__html: tableQuery};}
      return (
        <>
          <h3 className="block_title">{tableTitle}</h3>
          <table className='col-12' id={index+'__table'}>{tabletoappend}</table>
          <div className="exportchart card-tools col-md-12 col-sm-12">
            <a id={"export_"+index}
              className="btn btn-info btn-border btn-round btn-sm mr-2"
              onClick={() => exportTableHtml(index, 'table')}>
              Embed
            </a>
            <a id={"csv_"+index}
              className="btn btn-info btn-border btn-round btn-sm mr-2"
              onClick={() => exportTableCsv(index, 'table')}>
              CSV
            </a>
            <a href='#' id={index+"_query_tooltip"}
              role="button"
              data-toggle='modal'
              data-target={'#'+index+'_query'}
              className="btn btn-info btn-border btn-round btn-sm">
              Query
            </a>


            <div className="modal fade"
                id={index+'_query'}
                tabIndex="-1" role="dialog"
                aria-labelledby={index+'_querytitle'}
                aria-hidden="true">
                <div className="modal-dialog modal-lg" role="document">
                    <div className="modal-content card">
                        <div className="modal-header">
                            <h4 id={'#'+index+'_querytitle'} className="card-title">
                            SPARQL query</h4>
                        </div>
                        <div className="modal-body">
                            <div
                              className="container"
                              dangerouslySetInnerHTML={createMarkup()}>

                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-danger"
                                data-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </>
      )

    }


}
