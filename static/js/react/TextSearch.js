const TextSearch = ({ unique_key, index ,
                removeComponent , componentList, setComponent,
                sortComponentUp , sortComponentDown}) => {

    let title_default= "", query_default ="", tableresults;

    // WYSIWYG: get content if any
    if (datastory_data.dynamic_elements && datastory_data.dynamic_elements.length) {
      datastory_data.dynamic_elements.forEach(element => {
        if (element.type == 'textsearch' && element.position == index) {
          title_default = element.textsearch_title ;
          query_default = element.textsearch_query ;
        }
      })
    }

    const [title, setSearchTitle] = React.useState(title_default);
    const titleChange = event => { setSearchTitle(event.target.value); };

    const [query, setSearchQuery] = React.useState(query_default);
    const queryChange = event => { setSearchQuery(event.target.value); };

    const [queryString, setQueryString] = React.useState('');
    const updateQueryString = event => { setQueryString(event.target.value); };


    const [spinner, setSpinner] = React.useState(false);

    const fetchTextquery = event => {
      if (query.length > 1) {
        setSpinner(true);
        // replace queryString in query
        const textsearch_query = query.replace('<<searchterm>>', '\"'+queryString+'\"');
        // empty table and remove all previous searches
        document.getElementById(index + "__textsearchresults").innerHTML = '&nbsp;';

        fetch(datastory_data.sparql_endpoint+'?query='+encodeURIComponent(textsearch_query),
          {
          method: 'GET',
          headers: { 'Accept': 'application/sparql-results+json' }
          }
        ).then((res) => res.json())
         .then((data) => {
           setSpinner(false);
           console.log(data);
           // create table
           tableresults = '<tr>';

           var headings = data.head.vars;
           headings.forEach((item, inde) => {
             if (!item.includes('Label')) { tableresults += "<th>"+item+"</th>";}
           });

           headings.forEach((item, inde) => {
             if (item.includes('Label')) {
               headings.splice(inde, 1);
               inde--;}
           });


           // format table
           tableresults += "</tr>";
           //if (returnedJson.length >= 1) {
           data.results.bindings.forEach((item, i) => {
             tableresults += "<tr>";
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
                 tableresults += "<td>";

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

                 // var buttons = addActionButton(actions, headings[j], pos, res_value, res_label);
                 tableresults += "</td>";
               }
               else {
                   tableresults += "<td>";
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
                   //tableresults += "<span class='table_result'>" + res_value + "</span>";
                   // var buttons = addActionButton(actions, headings[j], pos, res_value, res_value);
                   tableresults += "</td>";
               }


             });
             tableresults += "</tr>";
           });
           $("#" + index + "__textsearchresults").append(tableresults);
          })
         .catch((error) => {
            console.error('Error:', error);
            alert("There is an error in the query");
            setSpinner(false);
         });

      }
      else {console.log("no query");}
    }


    // WYSIWYG: render component and preview
    if (window.location.href.indexOf("/modify/") > -1) {
      return (
      <div id={index+"__block_field"} className="block_field">
        {spinner && (<span id='loader' className='lds-dual-ring overlay'></span>)}
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
          <table className='col-12' id={index+"__textsearchresults"}>
          </table>
        </div>
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
          <p><em>Enter something in the search box an click on the search button to run the query</em></p>
        </div>
      </div>
      )
    } else {
      // Final story: render preview
      return (
        <div className='card-body justify-content-center option-2b  col-md-3'>
          <h3 className="block_title">{title}</h3>
        </div>
      )
    }
}
