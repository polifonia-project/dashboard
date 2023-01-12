const generateKey = (pre) => {
    return `${ pre }_${ new Date().getTime() }`;
}

const FilterCheckbox = ({ key_check, value_check , indexPanel , filter_title}) => {

  const [checked, setCheck] = React.useState('')
  console.log("calling FilterCheckbox");
  return (<p>hello</p>)
  // return (
  //   <p>
  //     <input
  //       type='checkbox'
  //       label={value_check[0] + " (" + value_check[1] + ")"}
  //       defaultValue={key_check}
  //       name={key_check}
  //       className="map_checkbox"
  //       data-filter={filter_title}>
  //     </input>
  //     <label htmlFor="key_check">
  //       {value_check[0] + " (" + value_check[1] + ")"}
  //     </label>
  //   </p>
  // )
}

const SidebarPanel = ({indexPanel , index_parent , filterData }) => {
  const checkboxBox = []
  const getCheckboxes = event => {
    // get data points
    var dataMap = JSON.parse(document.getElementById('dataMap').innerHTML);
    var values = "VALUES ?point {";
    dataMap.forEach((item, i) => { values += '<' + item.properties.uri + '> '; });
    values += '}';

    let filter_title= filterData.map_filter_title,
        f_query = filterData.map_filter_query;

    // restructure query with VALUES
    var decoded_query = decodeURIComponent(f_query);
    var decoded_query_parts = decoded_query.split(/\{(.*)/s);
    decoded_query = decoded_query_parts[0] + '{' + values + decoded_query_parts[1];
    var encoded_query = encodeURIComponent(decoded_query.replace('\n', ' '));

    fetch(datastory_data.sparql_endpoint+'?query='+encoded_query,
        {
        method: 'GET',
        headers: { 'Accept': 'application/sparql-results+json' }
        }
    ).then((res) => res.json())
    .then((data) => {
       let labels_values_count = {}, headings = data.head.vars,
            has_label = false;

       data.results.bindings.forEach((res, i) => {
         // check if the filter is a string or a uri+string
         if (headings.includes('filterLabel')) { has_label = true; }

         dataMap.forEach((elem, i) => {
           if (elem.properties.uri == res.point.value) {
             if (has_label == true) {
               elem.properties[filter_title + "#label"] = res.filterLabel.value;
               elem.properties[filter_title + "#value"] = res.filter.value;
               if (labels_values_count[res.filter.value] == undefined) {
                   labels_values_count[res.filter.value] = [res.filterLabel.value, 1]
               } else {
                   labels_values_count[res.filter.value] = [res.filterLabel.value, labels_values_count[res.filter.value][1] + 1]
               }
             }
             else {
               elem.properties[filter_title + "#label"] = res.filter.value;
               elem.properties[filter_title + "#value"] = res.filter.value;
               if (labels_values_count[res.filter.value] == undefined) {
                   labels_values_count[res.filter.value] = [res.filter.value, 1]
               } else {
                   labels_values_count[res.filter.value] = [res.filter.value, labels_values_count[res.filter.value][1] + 1]
               }
             }
           }
         });

         // update geoJSON in DOM
         $('#dataMap').remove();
         var $body = $(document.body);
         $body.append("<script id='dataMap' type='application/json'>" + JSON.stringify(dataMap) + "</script>");

         // update markers
         // markers.eachLayer(layer => {
         //     if (layer.feature.properties.uri == res.point.value) {
         //         if (has_label == true) {
         //             layer.feature.properties[filter_title + "#label"] = res.filterLabel.value;
         //         } else {
         //             layer.feature.properties[filter_title + "#label"] = res.filter.value;
         //         }
         //         layer.feature.properties[filter_title + "#value"] = res.filter.value;
         //     }
         // });

       });

       // get markers from geoJSON, bind popupContent
       //var data_layers = L.geoJSON(dataMap, { onEachFeature: onEachFeature  });

       // add checkboxes

       for (const [key_check, value_check] of Object.entries(labels_values_count)) {
         console.log("labels_values_count",labels_values_count);
         checkboxBox.push(<FilterCheckbox
           key={generateKey(key_check+value_check[0])}
           key_check={key_check} value_check={value_check[0]}
           indexPanel={indexPanel} filter_title={filter_title}
           />)
       }

       return labels_values_count;
      })
    .catch((error) => { console.error('Error:', error); })
    .finally( (labels_values_count) => {
     $('#loader').addClass('hidden');

    });

    $("#filter_"+filterData.extra_id).collapse();
  }

  return (
    <div className="map_sidebar_panel">
      <a role="button"
      className="map_sidebar_panel_title"
      data-toggle="collapse"
      onClick={getCheckboxes}
      href={"#filter_"+filterData.extra_id}
      aria-expanded="false" aria-controls="collapseExample">
      {filterData.map_filter_title}
    </a>
    <div className="collapse" id={"filter_"+filterData.extra_id}>
      <div>
        {checkboxBox}
      </div>
    </div>
    </div>
  )
}

const MapSidebar = ({index, filters}) => {

  const sidebarPanelsBox = []
  const [isExpanded, setExpanded] = React.useState(false)

  function gradientbackground(el) {
      el.style.background = 'linear-gradient(-45deg,' + datastory_data.color_code[0] + ',' + datastory_data.color_code[1] + ')';
  }

  React.useEffect(() => {
    document.querySelectorAll(".map_sidebar").forEach(gradientbackground);
  }, []);

  filters.forEach((filter, i) => {
    sidebarPanelsBox.push(
      <SidebarPanel
          indexPanel={i} key={generateKey(filter)+i}
          index_parent={index} filterData={filter}/>
    )
  });

  const expandSidebar = event => {
    if (isExpanded == false) {
      setExpanded(true);
    } else {
      // collapse sidebar
    }

  }

  if (filters.length) {
    return (
      <div
        onClick={() => expandSidebar}
        className="map_sidebar">
        {sidebarPanelsBox}
      </div>
    )
  }

}

const FilterMap = ({ indexFilter, index_parent ,
                      filters, setFilter }) => {

  let defaultFilterQuery = '', defaultFilterTitle = ''
  if (datastory_data.dynamic_elements && datastory_data.dynamic_elements.length) {
    datastory_data.dynamic_elements.forEach(element => {
      if (element.type == 'map' && element.position == index_parent) {
        if (element.map_filters.length > indexFilter) {
          defaultFilterQuery = element.map_filters[indexFilter].map_filter_query;
          defaultFilterTitle = element.map_filters[indexFilter].map_filter_title;
        }
      }
    })
  }

  const [filterQuery, setFilterQuery] = React.useState(defaultFilterQuery);
  const filterQueryChange = index => event => {
    setFilterQuery(event.target.value);
    let newArr = [...filters];
    newArr[index].map_filter_query = event.target.value;
    setFilter(newArr);
  };

  const [filterTitle, setFilterTitle] = React.useState(defaultFilterTitle);
  const filterTitleChange = index => event => {
    setFilterTitle(event.target.value);
    let newArr = [...filters];
    newArr[index].map_filter_title = event.target.value;
    setFilter(newArr);
  };

  // fetchFilterQuery
  const fetchFilterQuery = index_parent => event => {
    if (filterQuery.length > 1) { }
  };

  React.useEffect(() => {
     fetchFilterQuery(index_parent);
  }, []);

  let filter_id = new Date().getTime();
  return (
    <div className="query-div">
    <hr/>
      <h4 style={{ color: 'white'}}>Add a filter</h4><br/>
      {/* add remove component new*/}
      <div className='form-group' id={indexFilter+"__form_group_filter"}>
        <label htmlFor='largeInput'>SPARQL query</label>
        <textarea
            onMouseLeave={fetchFilterQuery(index_parent)}
            onChange={() => filterQueryChange(indexFilter)}
            id={index_parent+"__map_filter_query_"+filter_id}
            name={index_parent+"__map_filter_query_"+filter_id}
            defaultValue={filterQuery}
            placeholder='A SPARQL query that returns two variables' required>
        </textarea>
        <label htmlFor='largeInput'>Filter title</label>
    		<input className='form-control'
            onChange={() => filterTitleChange(indexFilter)}
            type='text'
            id={index_parent+"__map_filter_title_"+filter_id}
            name={index_parent+"__map_filter_title_"+filter_id}
            defaultValue={filterTitle}
            placeholder='The label of the filter'>
        </input>
      </div>
    </div>
  )

}

const MapViz = ({ unique_key, index ,
                removeComponent , componentList, setComponent,
                sortComponentUp , sortComponentDown}) => {

  let map_title = '', map_points_query = '',
      waitfilters ,
      markers, allMarkers , map_filters = [],
      mapid = index + "__map_preview_container",
      checked_filters = [];

  // WYSIWYG: get content if any
  if (datastory_data.dynamic_elements && datastory_data.dynamic_elements.length) {
    datastory_data.dynamic_elements.forEach(element => {
      if (element.type == 'map' && element.position == index) {
        map_points_query = element.map_points_query;
        map_title = element.map_title;
        // filters
        if (element.map_filters && element.map_filters.length) {
          element.map_filters.forEach(element => {
            map_filters.push(element);
          }) ;
        }
      }
    })
  }

  const [query, setQuery] = React.useState(map_points_query);
  const queryChange = event => { setQuery(event.target.value); };

  const [title, setTitle] = React.useState(map_title);
  const titleChange = event => { setTitle(event.target.value); };

  const [mapInstance, setMap] = React.useState('not initialised');
  const [sidebarInstance,setSidebar] = React.useState('not initialised');

  const [filters, setFilter] = React.useState(map_filters);
  const filterQueriesBox = [];
  const filterChange = event => {
    setFilter(prevExtras => [
      ...prevExtras, {map_filter_query:'',map_filter_title:''}
    ]);
  };

  const initMap = event => {

    if (mapInstance != 'initialised') {
      // document.getElementById(mapid).innerHTML = "<div class='map_preview_container' id='"+index+"__map_preview_container'></div>";
      // if (map && map.remove) {map.off(); map.remove();}
      map = L.map(mapid).setView([51.505, -0.09], 3);
      L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png?api_key=5303ddca-5934-45fc-bdf1-40fac7966fa7', {
      maxZoom: 19, attribution: '© OpenStreetMap'
      }).addTo(map);
    }

    if (query.length > 1) {
      $('#loader').removeClass('hidden');
      //if (map && map.remove) { map.off(); map.remove(); }
      fetch(datastory_data.sparql_endpoint+'?query='+encodeURIComponent(query),
        {
        method: 'GET',
        headers: { 'Accept': 'application/sparql-results+json' }
        }
      ).then((res) => res.json())
      .then((data) => {

          // add markers
          var geoJSONdata = creategeoJSON(data);
          markers = setViewMarkers(map, mapid, geoJSONdata, waitfilters, datastory_data.color_code[0]);
          allMarkers = setViewMarkers(map, mapid, geoJSONdata, waitfilters, datastory_data.color_code[0]);
        })
       .catch((error) => { console.error('Error:', error); })
       .finally( () => {
         $('#loader').addClass('hidden');
         setMap('initialised');

       });
    }

  };

  function setViewMarkers(map, mapid, geoJSONdata, waitfilters, color_code) {
      // remove markers if any from a map already initialised
      map.eachLayer(function (layer) {
          if (layer instanceof L.MarkerClusterGroup) {
              map.removeLayer(layer)
          }
      });
      // remove geoJSON
      $('#dataMap').remove();

      // style clusters
      var innerClusterStyle = "display: inline-block; background:" + color_code + ";\
  		width: 40px; height: 40px !important; border-radius: 50% !important; padding-top: 10px; opacity: 0.8;"

      var markers = L.markerClusterGroup({
          iconCreateFunction: function (cluster) {
              var markers = cluster.getAllChildMarkers();
              var n = 0;
              markers.forEach((item, i) => { n += 1});
              return L.divIcon({ html: "<span style='" + innerClusterStyle + "'>" + n + "</span>", className: 'mycluster pointer-color', iconSize: L.point(40, 40) });
          },
          singleMarkerMode: true
      });

      // get markers from geoJSON, bind popupContent
      var data_layers = L.geoJSON(geoJSONdata, {
          onEachFeature: onEachFeature
      });

      // add markers to clusters
      markers.addLayer(data_layers);

      // show clusters
      map.addLayer(markers);

      // add geoJSONdata to DOM
      var $body = $(document.body);
      $body.append("<script id='dataMap' type='application/json'>" + JSON.stringify(geoJSONdata) + "</script>");
      // if (waitfilters == true) {
      //     map_ready = true;
      //     $('form').trigger('change');
      // }
      return markers;
  };

  function onEachFeature(feature, layer) {
      // does this feature have a property named popupContent?
      if (feature.properties && feature.properties.popupContent) {
          layer.bindPopup(feature.properties.popupContent);
      }
  };

  function creategeoJSON(returnedJson) {
      var geoJSONdata = [];
      // clean headings
      var headings = returnedJson.head.vars;
      var there_is_point = headings.indexOf('point');
      headings.forEach((item, i) => {
        if (item == ('lat') || item == ('long') || item == ('point')) {
            headings.splice(i, 1); i--;
        }
      });

      // for (j = 0; j < headings.length; j++) {
      //     if (headings[j] == ('lat') || headings[j] == ('long') || headings[j] == ('point')) {
      //         headings.splice(j, 1); j--;
      //     }
      // }

      // create geoJSON object
      returnedJson.results.bindings.forEach((item, i) => {
        let pointObj = {};
        pointObj.type = "Feature";
        pointObj.properties = {};
        pointObj.properties.popupContent = "";

        headings.forEach((head, i) => {
          pointObj.properties.popupContent += item[head].value + '.\n\ '
        });

        if (there_is_point != -1) {
            pointObj.properties.uri = item['point'].value;
            pointObj.properties.popupContent += "<br><a target='_blank' href='" + item.point.value + "'>URI</a>"
        };
        pointObj.geometry = {};
        pointObj.geometry.type = "Point";
        // check first
        pointObj.geometry.coordinates = [item.long.value, item.lat.value];
        geoJSONdata.push(pointObj);
      });

      return geoJSONdata
  };



  function collapseFilter(panel_id) { $("#" + panel_id + " p").toggle(); }


  if (filters) {
    for (let i = 0; i < filters.length; i++) {
      filterQueriesBox.push(<FilterMap
          indexFilter={i} key={generateKey(filters[i].map_filter_query)+i}
          index_parent={index} setExtras={setFilter} filters={filters}/>)
    }
  }

  // preview
  React.useEffect(() => {
    if (mapInstance != 'initialised') { initMap(); }

  }, []);

  // WYSIWYG: render component and preview
  if (window.location.href.indexOf("/modify/") > -1) {
    return (
      <>
      <div id={index+"__block_field"} className="block_field">
        <h4 className="block_title">Add a map</h4>
        <SortComponent
          index={index}
          sortComponentUp={sortComponentUp}
          sortComponentDown={sortComponentDown}
          key={unique_key} />
        <RemoveComponent
          index={index}
          removeComponent={removeComponent}
          key={unique_key} />
        <div className='form-group' id={index+"__form_group"}>
          <label htmlFor='map_title'>Map title</label>
          <input
            className='map_title'
            id={index+"__map_title"}
            type='text'
            defaultValue={title}
            onChange={titleChange}
            name={index+"__map_title"}
            placeholder='The title of the map'>
          </input>
          <label htmlFor='addplaceholder_points'>SPARQL query</label>
    			<textarea
              className='addplaceholder_points'
    					name={index+"__map_points_query"}
              type='text' rows='4'
    					id={index+"__map_points_query"}
              onChange={queryChange}
              defaultValue={query}
    					required>
          </textarea>
          <a
            style={{cursor:'pointer'}}
            onClick={initMap}>Run the query</a>
        </div>
        <h3>{title}</h3>
        <div
          className='map_preview_container'
          id={index+'__map_preview_container'}>
          <MapSidebar
            index={index}
            filters={filters}
            key={"sidebar_"+unique_key+index} />
        </div>
        <a id={index+"__addmapfilter"}
          className='btn btn-primary btn-border'
          onClick={filterChange}
          extra='True'
          name={index+"map_filter"}>Add a filter</a>
        {filterQueriesBox}
      </div>

      </>

    );
  } else {
    // Final story: render preview
    return (
      <>
        <h3 className="block_title float_none">{title}</h3>
        <div
          className='map_preview_container'
          id={index+'__map_preview_container'}>
        </div>
      </>
    )
  }
}
