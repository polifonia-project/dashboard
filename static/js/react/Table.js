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

    const [spinner, setSpinner] = React.useState(false);

    const fetchQuery = event => {
      setSpinner(true)
      if (tableQuery.length > 1) {
        $("#" + index + "__table").innerHTML = "&nbsp;";
        fetch(datastory_data.sparql_endpoint+'?query='+encodeURIComponent(tableQuery),
          {
          method: 'GET',
          headers: { 'Accept': 'application/sparql-results+json' }
          }
        ).then((res) => res.json())
         .then((data) => {
           setSpinner(false);
           tabletoappend = '<tr>';

           var headings = data.head.vars;
           headings.forEach((item, inde) => {
             if (!item.includes('Label')) { tabletoappend += "<th>"+item+"</th>";}

           });

           headings.forEach((item, inde) => {
             if (item.includes('Label')) {
               headings.splice(inde, 1);
               inde--;}
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

                 // audio
                 if (res_value.endsWith('.mp3')) {
                   tabletoappend += "<span>"+res_label+"</span><audio class='table_result'><source src='" + res_value + "'></source></audio>";
                 }
                 // img
                 else if (res_value.endsWith('.jpg') || res_value.endsWith('.png')) {
                   tabletoappend += "<span>"+res_label+"</span><img class='img_table' src='" + res_value + "'/>";
                 }
                 // video
                 else if (res_value.endsWith('.mp4') || res_value.endsWith('.ogg')) {
                   tabletoappend += "<span>"+res_label+"</span><video controls class='table_result'><source src='" + res_value + "'></source></video>";
                 }
                 // youtube
                 else if (res_value.includes("youtube.com/embed/")) {
                   tabletoappend += '<span>'+res_label+'</span><div id=embed-google-map style="height:100%; width:100%;max-width:100%;"><iframe allowFullScreen="allowFullScreen" src="'+res_value+'?ecver=1&amp;iv_load_policy=1&amp;rel=0&amp;yt:stretch=16:9&amp;autohide=1&amp;color=red&amp;width=186&amp;width=186" width="186" height="105" allowtransparency="true" frameborder="0"></iframe>';
                 }
                 // URL
                 else {
                   tabletoappend += "<a class='table_result' href='" + res_value + "'>" + res_label + "</a>";
                 }

                 // var buttons = addActionButton(actions, headings[j], pos, res_value, res_label);
                 tabletoappend += "</td>";
               }
               else {
                   tabletoappend += "<td>";
                   if (res_value.endsWith('.mp3')) {
                     tabletoappend += "<audio controls src='" + res_value + "' class='table_result'><a href='" + res_value + "'></a></audio>";
                   }
                   else if (res_value.endsWith('.jpg') || res_value.endsWith('.png')) {
                     tabletoappend += "<img class='img_table' src='" + res_value + "'/>";
                   }
                   else if (res_value.endsWith('.mp4') || res_value.endsWith('.ogg')) {
                     tabletoappend += "<video controls class='table_result'><source src='" + res_value + "'></source></video>";
                   }
                   else if (res_value.includes("youtube.com/embed/")) {
                     tabletoappend += '<div id=embed-google-map style="height:100%; width:100%;max-width:100%;"><iframe allowFullScreen="allowFullScreen" src="'+res_value+'?ecver=1&amp;iv_load_policy=1&amp;rel=0&amp;yt:stretch=16:9&amp;autohide=1&amp;color=red&amp;width=186&amp;width=186" width="186" height="105" allowtransparency="true" frameborder="0"></iframe>';
                   }
                   else {
                     tabletoappend += "<span class='table_result'>" + res_value + "</span>";
                   }
                   //tabletoappend += "<span class='table_result'>" + res_value + "</span>";
                   // var buttons = addActionButton(actions, headings[j], pos, res_value, res_value);
                   tabletoappend += "</td>";
               }


             });
             tabletoappend += "</tr>";
           });

           document.getElementById(index + "__table").innerHTML = '&nbsp;';
           $("#" + index + "__table").append(tabletoappend);
           // if (type.length > 0) {
           //     exportTableHtml(pos, type);
           //     exportTableCsv(pos, type, table_title);
           // }


          })
         .catch((error) => {
            console.error('Error:', error);
            alert("There is an error in the query");
         })
         .finally( () => { });

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

       $("textarea").each(function () {
         this.setAttribute("style", "height:" + (this.scrollHeight) + "px;overflow-y:hidden;");
       }).on("input", function () {
         this.style.height = 0;
         this.style.height = (this.scrollHeight) + "px";
       });

    }, []);

    if (window.location.href.indexOf("/modify/") > -1) {
      return (
      <div id={index+"__block_field"} className="block_field">
      {spinner && (<span id='loader' className='lds-dual-ring overlay'></span>)}
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
