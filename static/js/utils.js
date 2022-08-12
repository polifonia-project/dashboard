export function make_tablecomboaction_field(counter) {

  var tablecomboaction_field = "\
  <input class='tablevalueaction_title' \
      id='" + (counter + 1).toString() + "__tablevalueaction_title' type='text' \
      name='" + (counter + 1).toString() + "__tablevalueaction_title' \
      placeholder='A title, e.g. Show tunes in common'>\
  <input class='tablevalueaction_column' \
      id='" + (counter + 1).toString() + "__tablevalueaction_column_1' type='text' \
      name='" + (counter + 1).toString() + "__tablevalueaction_column_1' \
      placeholder='The name of the column from one table to combine'>\
  <input class='tablevalueaction_column' \
      id='" + (counter + 1).toString() + "__tablevalueaction_column_2' type='text' \
      name='" + (counter + 1).toString() + "__tablevalueaction_column_2' \
      placeholder='The name of the column from the other table to combine'>\
  <input class='tablevalueaction_table' \
      id='" + (counter + 1).toString() + "__tablevalueaction_table' type='hidden' \
      name='" + (counter + 1).toString() + "__tablevalueaction_table' \
      value='"+bind_query_id+"'>\
  <textarea class='addplaceholder_tablecomboaction' \
      oninput='auto_grow(this)' \
      name='" + (counter + 1) + "__tablevalueaction_query' type='text' \
      id='" + (counter + 1) + "__tablevalueaction_query' \
      rows='6' required></textarea>\
  <p><em>Type your query and perform a new search above to see the result</em></p>\
  <h4 id='" + (counter + 1).toString() + "__addtablevalueactiontitle'\
      class='text-white'>Do you want to add an action to your results?</h4>\
  <p>Row values can be subject of new queries and return tables or charts. \
  For each action a button will appear in the table. You can also combine results of this \
  action with results of a prior action or search.</p>\
  <a class='btn btn-primary btn-border' \
      onclick='add_field(name,\"" + (counter + 1).toString() + "__textsearch_query\")' \
      name='tablevalueaction'>Add\
      action to results</a>\
  <a class='btn btn-primary btn-border' \
      onclick='add_field(name,\"" + (counter + 1).toString() + "__textsearch_query\")' \
      name='tablecomboaction'>\
      Combine results</a>";
  return tablecomboaction_field;
};
