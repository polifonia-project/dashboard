const Count = ({ unique_key, index ,
                removeComponent , componentList, setComponent,
                sortComponentUp , sortComponentDown}) => {

  let count_label= "", count_query = "", count = "";

  // WYSIWYG: get content if any
  if (datastory_data.dynamic_elements && datastory_data.dynamic_elements.length) {
    datastory_data.dynamic_elements.forEach(element => {
      if (element.type == 'count' && element.position == index) {
        count_query = element.count_query ;
        count_label = element.count_label;
      }
    })
  }

  const [query, setQuery] = React.useState(count_query);
  const queryChange = event => { setQuery(event.target.value); };

  const [label, setLabel] = React.useState(count_label);
  const labelChange = event => { setLabel(event.target.value); };


  const fetchQuery = event => {
    if (query.length > 1) {
      fetch(datastory_data.sparql_endpoint+'?query='+encodeURIComponent(query),
        {
        method: 'GET',
        headers: { 'Accept': 'application/sparql-results+json' }
        }
      ).then((res) => res.json())
       .then((data) => {
         count = data.results.bindings[0].count.value;
         $("#" + index + "__num").text(count);
        })
       .catch((error) => {
          console.error('Error:', error);
          count = "Error!"
       });

    }
  }

  // preview counter
  React.useEffect(() => {
     fetchQuery();

     let color_1 = datastory_data.color_code[0], color_2 = datastory_data.color_code[1]
     var counters = document.querySelectorAll(".count_result");
     function borders(el) {
         el.style.border = "solid 2px " + color_1;
         el.style.color = color_1;
     }
     counters.forEach(borders);
  }, []);

  // WYSIWYG: render component and preview
  if (window.location.href.indexOf("/modify/") > -1) {
    return (
      <div id={index+"__block_field"} className="block_field">
        <h4 className="block_title">{index}. Add counter</h4>
        <SortComponent
          index={index}
          sortComponentUp={sortComponentUp}
          sortComponentDown={sortComponentDown}
          key={unique_key} />
        <RemoveComponent
          index={index}
          removeComponent={removeComponent}
          key={unique_key} />
          <div className='card-body justify-content-center option-2b count_result col-md-4'>
            <p className='counter_num' id={index+"__num"}>{count}</p>
            <p className='counter_label' id={index+"__lab"}>{label}</p>
          </div>
          <textarea name={index+"__count_query"} type='text'
              spellCheck='false'
              onChange={queryChange}
              id={index+"__count_query"} rows='3'
              defaultValue={query}
              onMouseLeave={fetchQuery}
              placeholder='A SPARQL query that returns a number. Use the variable ?count' required>

          </textarea>
          <input name={index+"__count_label"}
              type='text'
              id={index+"__count_label"}
              onChange={labelChange}
              defaultValue={label}
              placeholder='The label of the counter' required />
        </div>
    );
  } else {
    // Final story: render preview
    return (
      <div className='card-body justify-content-center option-2b count_result col-md-4'>
        <p className='counter_num' id={index+"__num"}>{count}</p>
        <p className='counter_label' id={index+"__lab"}>{label}</p>
      </div>
    )
  }
}
