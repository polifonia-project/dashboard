const generateKey = (pre) => {
    return `${ pre }_${ new Date().getTime() }`;
}

function update_datastory(form) {
  const formData = new FormData(form);
  var url = window.location.toString()
  url = url.replace(/modify\//, 'modify_bkg\/');
  fetch(url, { method: 'POST', body: formData})
    .then(response => response.text())
    .then((data) => { if (data) {datastory_data = JSON.parse(data);} })
    .catch(function (error) {console.log(error);});
  return datastory_data;
}

const FilterCheckbox = ({ key_check, value_check , indexPanel ,
      filter_title , markers, allMarkers, map}) => {
  const [checked, setCheck] = React.useState('not checked');

  function addRemoveMarkers() {
    checked_filters = Array.from(document.querySelectorAll('input[class="map_checkbox"]:checked'));
    if (markers != undefined) {
        markers.clearLayers();
        allMarkers.eachLayer(layer => { markers.addLayer(layer); });

        // get the filter names
        let filternames = [];
        if (checked_filters.length) {
            for (const value of checked_filters.values()) {
                filternames.push(value.dataset.filter);
            }
        }
        // [ filter1, filter2 ...]
        filternames = [...new Set(filternames)];

        // add values checked
        var filternames_values = {};
        filternames.forEach(function (el, index) { filternames_values[el] = []; });

        // { filter1: [ checkbox1value, checkbox2value], filter2 : [ ... ] ...]
        if (checked_filters.length) {
            for (const value of checked_filters.values()) {
                filternames_values[value.dataset.filter].push(value.value)
            }
        }

        if (Object.keys(filternames_values).length) {
          let f_names = Object.keys(filternames_values);
          f_names.forEach((name, i) => {
            markers.eachLayer(layer => {
              // if property value not in the list of checked-checkboxes values remove marker
              var prop_key = name + '#value';
              var prop_value = layer.feature.properties[prop_key];
              if (!filternames_values[name].includes(prop_value)) {
                  markers.removeLayer(layer);
              }
            });
          });

          // clear map
          map.eachLayer(function (layer) {
              if (layer instanceof L.MarkerClusterGroup) {
                  map.removeLayer(layer)
              }
          });
          map.addLayer(markers);
        }
        // else put them all back!
        else {

            map.eachLayer(function (layer) {
                if (layer instanceof L.MarkerClusterGroup) {
                    map.removeLayer(layer)
                }
            });
            markers.clearLayers();
            allMarkers.eachLayer(layer => {
                markers.addLayer(layer);
            });
            map.addLayer(markers);
        }
    }
  }

  const changeCheck = event => {
    if (checked == 'not checked') {
      setCheck('checked');
    } else {
      setCheck('not checked');
    }
    addRemoveMarkers();

  }
  return (
    <p>
      <input
        type='checkbox'
        label={value_check[0] + " (" + value_check[1] + ")"}
        defaultValue={key_check}
        name={key_check}
        onClick={changeCheck}
        className="map_checkbox"
        data-filter={filter_title}>
      </input>
      <label htmlFor="key_check">
        {value_check[0] + " (" + value_check[1] + ")"}
      </label>
    </p>
  )
}

const SidebarPanel = ({indexPanel ,
    index_parent , onEachFeature , filters, markers, allMarkers, map}) => {

  const [collapsedBox, setCollapse] = React.useState('not collapsed');
  const [firstLoad, setLoad] = React.useState('not loaded');

  const [checkboxData,setCheckbox] = React.useState([]);
  const checkboxBox = []

  let filter_title= filters[indexPanel].map_filter_title,
      f_query = filters[indexPanel].map_filter_query, extra_id = filters[indexPanel].extra_id;

  function update_panel() {
    if (datastory_data.dynamic_elements && datastory_data.dynamic_elements.length) {
      datastory_data.dynamic_elements.forEach(element => {
        if (element.type == 'map' && element.position == index_parent) {
          if (element.map_filters.length > indexPanel) {
            element.map_filters.forEach((item, i) => {
              if (item.position == indexPanel) {
                filter_title = item.map_filter_title ;
                f_query = item.map_filter_query;
                extra_id = item.extra_id
              }
            });
          }
        }
      })
    }
  }

  console.log("datastory Data",extra_id, filter_title,f_query);

  const getCheckboxes = event => {
    if (f_query.length > 1) {
      var dataMap = JSON.parse(document.getElementById('dataMap').innerHTML);
      var values = "VALUES ?point {";
      dataMap.forEach((item, i) => { values += '<' + item.properties.uri + '> '; });
      values += '}';

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
           markers.eachLayer(layer => {
               if (layer.feature.properties.uri == res.point.value) {
                   if (has_label == true) {
                       layer.feature.properties[filter_title + "#label"] = res.filterLabel.value;
                   } else {
                       layer.feature.properties[filter_title + "#label"] = res.filter.value;
                   }
                   layer.feature.properties[filter_title + "#value"] = res.filter.value;
               }
           });

         });

         // get markers from geoJSON, bind popupContent
         var data_layers = L.geoJSON(dataMap, { onEachFeature: onEachFeature  });

         // add checkboxes
         let filter_names = Object.keys(labels_values_count)
         setCheckbox([])
         filter_names.forEach((filter_name, i) => {
           setCheckbox(prevCheckboxes => [
             ...prevCheckboxes, { key_check: filter_name, value_check: labels_values_count[filter_name]}
           ])
         });

         setCollapse('collapsed');
         $("#filter_"+extra_id).collapse();
      })
      .catch((error) => { console.error('Error:', error); })
      .finally( () => { $('#loader').addClass('hidden'); setLoad('loaded'); });
    }

  }

  if (checkboxData.length) {
    for (let i = 0; i < checkboxData.length; i++) {
      checkboxBox.push(<FilterCheckbox
        key={generateKey(checkboxData[i].key_check)}
        key_check={checkboxData[i].key_check} value_check={checkboxData[i].value_check}
        indexPanel={indexPanel} filter_title={filter_title} markers={markers}
        allMarkers={allMarkers} map={map}
        />);
    }
  }


  React.useEffect(() => {
    update_panel();
    if (firstLoad == 'loaded') { getCheckboxes(); }
  }, []);

  return (
    <div className="map_sidebar_panel">
      <a role="button"
      className="map_sidebar_panel_title"
      data-toggle="collapse"
      onClick={getCheckboxes}
      href={"#filter_"+extra_id}
      aria-expanded="false" aria-controls={"filter_"+extra_id}>
      {filter_title}
    </a>
    <div className="collapse" id={"filter_"+extra_id}>
      <div>
        {checkboxBox}
      </div>
    </div>
    </div>
  )
}

const MapSidebar = ({index, filters , onEachFeature, allMarkers , markers, map}) => {

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
          index_parent={index} onEachFeature={onEachFeature}
          filters={filters}
          markers={markers} allMarkers={allMarkers} map={map}/>
    )
  });

  const expandSidebar = event => {
    if (isExpanded == false) { setExpanded(true);
    } else {
      // collapse sidebar
    }

  }

  if (filters.length) {
    return (
      <div
        onClick={() => expandSidebar}
        className="map_sidebar">
        <h3 className="map_sidebar_title">FILTERS</h3>
        {sidebarPanelsBox}
      </div>
    )
  }

}

const FilterMap = ({ indexFilter, index_parent ,
                      setFilterChange, filters, removeFilterBox }) => {

  let defaultFilterQuery = filters[indexFilter].map_filter_query,
      defaultFilterTitle = filters[indexFilter].map_filter_title;

  // if (datastory_data.dynamic_elements && datastory_data.dynamic_elements.length) {
  //   datastory_data.dynamic_elements.forEach(element => {
  //     if (element.type == 'map' && element.position == index_parent) {
  //       if (element.map_filters.length > indexFilter) {
  //         element.map_filters.forEach((item, i) => {
  //           if(item.position == indexFilter) {
  //             defaultFilterQuery = item.map_filter_query;
  //             defaultFilterTitle = item.map_filter_title;
  //           }
  //         });
  //       }
  //     }
  //   })
  // }

  const [filterQuery, setFilterQuery] = React.useState(defaultFilterQuery);
  const filterQueryChange = event => {
    let newArrQ = [...filters];
    newArrQ[indexFilter].map_filter_query = event.target.value;
    console.log("newArrQ",newArrQ);
    // console.log("before",filters);
    //setFilterChange(newArrQ);
    console.log("newFilter",filters);
    console.log("hello");
  };
  // function filterQueryChange = index => event => {

  // };

  const [filterTitle, setFilterTitle] = React.useState(defaultFilterTitle);
  const filterTitleChange = event => {
    let newArrQ = [...filters];
    newArrQ[indexFilter].map_filter_title = event.target.value;
    console.log("newArrQ",newArrQ);
    // console.log("before",filters);
    //setFilterChange(newArrQ);
    console.log("newFilter",filters);
    console.log("hello");
  };

  let filter_id = new Date().getTime();
  return (
    <div className="query-div" id={"el_"+indexFilter+"__form_group"}>
      <hr/>
      <h4 className='block_title'>Add a filter</h4>
      <a
        onClick={() => removeFilterBox(indexFilter)}
        className="trash trash_subcomponent">
        <i className="far fa-trash-alt"></i>
      </a><br/>

      <div className='form-group' id={indexFilter+"__form_group_filter"}>
        <label htmlFor='largeInput'>SPARQL query</label>
        <textarea
            onChange={filterQueryChange}
            id={index_parent+"__map_filter_query_"+filter_id+"_"+indexFilter}
            name={index_parent+"__map_filter_query_"+filter_id+"_"+indexFilter}
            defaultValue={filterQuery}
            placeholder='A SPARQL query that returns two variables' required>
        </textarea>
        <label htmlFor='largeInput'>Filter title</label>
    		<input className='form-control'
            onChange={filterTitleChange}
            type='text'
            id={index_parent+"__map_filter_title_"+filter_id+"_"+indexFilter}
            name={index_parent+"__map_filter_title_"+filter_id+"_"+indexFilter}
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

  const [markersMap, setMarkers] = React.useState(markers);
  const [allMarkersMap, setAllMarkers] = React.useState(allMarkers);

  const [query, setQuery] = React.useState(map_points_query);
  const queryChange = event => { setQuery(event.target.value); };

  const [title, setTitle] = React.useState(map_title);
  const titleChange = event => { setTitle(event.target.value); };

  const [mapInstance, setMap] = React.useState('not initialised');
  const [mapRendered, setMapRender] = React.useState('');
  const [sidebarInstance,setSidebar] = React.useState('not initialised');

  const [filters, setFilter] = React.useState(map_filters);

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
         setMapRender(map);
         setMarkers(markers);
         setAllMarkers(allMarkers);
       });
    }
    return map;
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

  const filterQueriesBox = []
  const filterChange = event => {
    setFilter(prevExtras => [
      ...prevExtras, {map_filter_query:'',map_filter_title:''}
    ]);
  };

  const [toBeRemoved, setToBeRemoved] = React.useState();

  const removeFilterBox = (indexFilter) => {

    var form = document.getElementById('modifystory_form');
    const formData = new FormData(form);
    var url = window.location.toString()
    url = url.replace(/modify\//, 'modify_bkg\/');

    fetch(url, { method: 'POST', body: formData})
      .then(response => response.text())
      .then((data) => { if (data) {
        datastory_data = JSON.parse(data);

        setFilter(old_filters => {
          let new_filters = []
          datastory_data.dynamic_elements.forEach(element => {
            if (element.type == 'map' && element.position == index) {
              if (element.map_filters && element.map_filters.length) {
                element.map_filters.forEach((elem,i) => {
                  if (elem.position != indexFilter) {new_filters.push(elem);}
                  //else {element.map_filters.splice(i,1);}
                }) ;
              }
            }
          })
          console.log("AFTER",datastory_data);
          return new_filters} )
      } })
      .catch(function (error) {console.log(error);});
  };

  if (filters) {
    for (let i = 0; i < filters.length; i++) {
      console.log("filters to regenerate",filters);
      filterQueriesBox.push(<FilterMap
          indexFilter={i} key={generateKey(filters[i].map_filter_title)+i}
          index_parent={index} setFilterChange={setFilter} filters={filters}
          removeFilterBox={removeFilterBox}/>)
    }
  }


  // preview
  React.useEffect(() => {
    if (mapInstance != 'initialised') { map = initMap(); }
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
            key={"sidebar_"+unique_key+index}
            onEachFeature={onEachFeature}
            allMarkers={allMarkersMap}
            markers={markersMap}
            map={mapRendered} />
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
          <MapSidebar
            index={index}
            filters={filters}
            key={"sidebar_"+unique_key+index}
            onEachFeature={onEachFeature}
            allMarkers={allMarkersMap}
            markers={markersMap}
            map={mapRendered} />
        </div>
      </>
    )
  }
}
