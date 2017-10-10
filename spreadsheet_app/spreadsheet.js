// Javascript for the spreadsheet app by Erin King

var spreadsheet = {
  num_rows : 9,
  num_columns : 9,
  mouse_hold : false,
  saved : true,
  formulas_checked : true,
  headers : [],
  formulas : {},

  // FOR TESTING ONLY:
  //saved_sheets : {},

  open : function() {
    this.mouse_hold = false;
    this.saved = true;
    this.formulas_checked = true;
    this.headers = ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K',
      'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
    this.formulas = new Object();

    // FOR TESTING ONLY:
    //this.saved_sheets = new Object();

    this.generate_cells();
    this.fade_alert("Click a cell to edit. Begin with '=' for a formula cell.");
  },

  // Known area for improvement: There's a few different places where I
  // loop over all the cells.  I can reduce code duplication by creating
  // a function that iterates over all the cells and calling it instead.
  generate_cells : function() {
    this.generate_header();
    for (var i = 1; i < this.num_rows; i++) {
      $("#spreadsheet").append("<tr id='row"+i+"'>");
      rowi = $("#row"+i)[0];
      $(rowi).append("<td id='_"+i+"'>"+i+"</td>");
      for (var j = 1; j < this.num_columns; j++) {
        $(rowi).append("<td id='"+this.headers[j]+i+"' contenteditable> </td>");
      }
      $("#spreadsheet").append("</tr>");
    }
  },

  generate_header : function() {
    $("#spreadsheet").append("<tr id='row0'>");
    for (var i = 0; i < this.num_columns; i++) {
      $("#row0").append("<th id='"+this.headers[i]+"0'>"+this.headers[i]+"</th>");
    }
    $("#spreadsheet").append("</tr>");
  },

  new_sheet : function() {
    $("#load").text("Load");

    confirming = $("#new").text() == "Confirm New";
    if (this.saved || confirming) {
      this.clear_cells();
      $("#title").text("");
      $("#new").text("New");
      this.saved = true;
    }
    else {
      this.fade_alert("You have unsaved data. Are you sure you want to start over?")
      $("#new").text("Confirm New");
    }
  },

  // Known Issue: always resets with the same size sheet instead of reverting to 8x8.
  clear_cells : function() {
    for (var i = 1; i < this.num_rows; i++) {
      for (var j = 1; j < this.num_columns; j++) {
        $("#"+this.headers[j]+i).text("");
      }
    }
  },

  save_cells : function() {
    $("#load").text("Load");
    $("#new").text("New");

    data = [];
    for (var i = 1; i < this.num_rows; i++) {
      rowdata = [];
      for (var j = 1; j < this.num_columns; j++) {
        content = $("#"+this.headers[j]+i).text();
        if (content != " " && content != "") {
          rowdata[j-1] = content;
        }
      }
      data.push(rowdata);
    }
    data = JSON.stringify(data);

    key = $("#title").text();
    if (key == "" || key=="null") {
      this.fade_alert("Please give a valid filename to save your spreadsheet with.");
      return;
    }
    save_data(key, data);
    this.saved = true;
    this.fade_alert("Your spreadsheet has been saved.");
  },

  // Known Issue: Loading sheets larger than the current one.
  load_cells : function() {
    $("#new").text("New");

    key = $("#title").text();
    if (key == null || key == "") {
      this.fade_alert("No file selected. Enter the key for the data you wish to retrieve below.");
      return;
    }
    confirming = $("#load").text() == "Confirm Load";
    if (this.saved || confirming) {
      data = load_data(key);
      if (data == undefined) {
        this.fade_alert("No file called \""+key+"\" exists.");
        return;
      }
      data = JSON.parse(data);
      this.populate_cells(data);
      $("#load").text("Load");
      this.saved = true;
    }
    else {
      this.fade_alert("You have unsaved data. Are you sure you want to load?")
      $("#load").text("Confirm Load");
    }
  },

  populate_cells : function(data) {
    this.clear_cells();
    for (var i = 0; i < this.num_rows-1; i++) {
      rowi = $("#row"+i)[0];
      rowdata = data[i];
      for (var j = 0; j < this.num_columns-1; j++) {
        itemj = $("#"+this.headers[j+1]+(i+1))[0];
        try {
          if (rowdata[j] || rowdata[j] == 0) {
            $(itemj).append(rowdata[j]);
          }
        }
        catch(TypeError) {
          $(itemj).append(" ");
        }
      }
    }
  },

  // Known Issue: Can't remove rows without refreshing.
  add_row : function() {
    $("#spreadsheet").append("<tr id='row"+this.num_rows+"'>");
    row = $("#row"+this.num_rows)[0];
    $(row).append("<td id='_"+this.num_rows+"'>"+this.num_rows+"</td>");
    for (var i = 1; i < this.num_columns; i++) {
      $(row).append("<td id='"+this.headers[i]+this.num_rows+"' contenteditable> </td>");
    }
    $("#spreadsheet").append("</tr>");
    this.num_rows++;
  },

  // Known Issue: Can't remove columns without refreshing.
  add_column : function() {
    if (this.num_columns == 26) {
      this.fade_alert("Sorry, only 26 columns are supported.");
      return;
    }
    header = $("#row0")[0];
    $(header).append("<th id='"+this.headers[this.num_columns]+"0'>"+this.headers[this.num_columns]+"</th>");
    for (var i = 1; i < this.num_rows; i++) {
      row = $("#row"+i)[0];
      $(row).append("<td id='"+this.headers[this.num_columns]+i+"' contenteditable> </td>");
    }
    this.num_columns++;
  },

  check_formulas : function() {
    for (var i = 1; i < this.num_rows; i++) {
      for (var j = 1; j < this.num_columns; j++) {
        cell_id = this.headers[i]+j;
        if ($("#"+cell_id).text()[0] == "=") {
          this.parse_formula(cell_id);
        }
      }
    }
    this.formulas_checked = true;
  },

  // Known Issue: Some formula entries result in unexpected answers.
  // For instance, if A1 contains "1" and B1 contains "2foo", and you
  // put "=A1+B1" into cell C1, C1 will display "3".
  // Formula cells usually display NaN for other invalid input values.
  parse_formula : function(cell_id) {
    formula = $("#"+cell_id).text().substring(1, $("#"+cell_id).text().length);

    // use regex to make expression, with the surpport of "A122"， "AB1" and more
    var expression = formula.replace(/([A-Z][0-9]+)/g, "parseFloat(\$('#$1').text())") ;

    // eval() works for basic arithmetic. If this were being shipped,
    // I understand it would have to be more rigorous.
    var answer = eval(expression);

    this.formulas[cell_id] = formula;
    $("#"+cell_id).text(answer);
  },

  // Known area for improvement: place cursor at end of text fields instead
  // of beginning when navigating with keyboard.
  arrow_navigation : function(keyCode, currentRow, currentColumn) {
    if (keyCode == 37) {        // Left Arrow
      newCell = ""+this.headers[Math.max(1,(currentColumn-1))]+currentRow;
    } else if (keyCode == 38) {  // Up Arrow
      newCell = ""+this.headers[currentColumn]+Math.max(1,(currentRow-1));
    } else if (keyCode == 39) { // Right Arrow
      newCell = ""+this.headers[Math.min((this.num_columns-1),(parseInt(currentColumn)+1))]+currentRow;
    } else if (keyCode == 40) { // Down Arrow
      newCell = ""+this.headers[currentColumn]+Math.min((this.num_rows-1),(parseInt(currentRow)+1));
    } else { return; }
    return newCell;
  },

  delete_selected : function(cell_elements) {
    for (var i = 0; i < cell_elements.length; i++) {
      $(cell_elements[i]).text("");
    }
  },

  fade_alert : function(alert_text) {
    $("#alert_field").text(alert_text);
    $("#alert_field").fadeIn(0);
    $("#alert_field").fadeOut(4000);
  },
}

///////////////////////////////////////////////////////////////////////////////
// KEY HANDLERS: //////////////////////////////////////////////////////////////
window.onkeydown = function(key) {
  code = key.keyCode ? key.keyCode : key.which;
  highlighted_cells = document.getElementsByClassName("highlight");

  // This is to prevent newlines in the title.
  if  (code == 13) {
    key.preventDefault();
  }

  // Multiple cells in the spreadsheet are highlighted.
  if (highlighted_cells.length > 0) {

    // Backspace / Delete key
    if (code == 8 || code == 46) {
      spreadsheet.delete_selected(highlighted_cells);
    }
  }

  // One cell of the spreadsheet is selected (in focus).
  if ($(":focus").is("td") && !event.shiftKey) {
    cell = $(":focus").attr("id");
    row = cell[1];
    column = spreadsheet.headers.indexOf(cell[0]);

    // Arrow Keys:
    if (code == 37 || code == 38 || code == 39 || code == 40) {
      newCell = spreadsheet.arrow_navigation(code, row, column);
      key.preventDefault();
      $("#"+newCell).focus();
    }
    // Enter Key:
    else if  (code == 13) {
      newCell = ""+spreadsheet.headers[1]+Math.min((spreadsheet.num_rows-1),(parseInt(row)+1));
      $("#"+newCell).focus();
    }
  }
  return;
}

///////////////////////////////////////////////////////////////////////////////
// HIGHLIGHT HANDLER: /////////////////////////////////////////////////////////
$(function() {
  $("#spreadsheet")
    .on("mousedown", "td", function() {
      spreadsheet.mouse_hold = true;
      $(".highlight").removeClass("highlight");
      begin = $(this).attr("id");
    })
    .on("mousemove", "td", function() {
      if (spreadsheet.mouse_hold) {
        end = $(this).attr("id");
        begin_i = Math.min(spreadsheet.headers.indexOf(begin[0]),
          spreadsheet.headers.indexOf(end[0]));
        end_i = Math.max(spreadsheet.headers.indexOf(begin[0]),
          spreadsheet.headers.indexOf(end[0]));
        begin_j = Math.min(begin[1], end[1]);
        end_j = Math.max(begin[1], end[1]);
        for (var i = begin_i-1; i < end_i; i++) {
          for (var j = begin_j-1; j < end_j; j++) {
            $("#"+spreadsheet.headers[i+1]+(j+1)).addClass("highlight");
          }
        }
      }
    });
});

$(document).mouseup(function() {
  spreadsheet.mouse_hold = false;
});

///////////////////////////////////////////////////////////////////////////////
// DATA CHANGE HANDLERS: ENSURE SAVE, AND CALCULATE FORMULAS. /////////////////
window.oninput = function(){
  if ($(":focus").is("td")) {
    spreadsheet.saved = false;
    spreadsheet.formulas_checked = false;
  }
}

$(function() {
  $("#spreadsheet")
    .on("focusin", "td", function() {
      cell = $(this).attr("id");
      if (spreadsheet.formulas.hasOwnProperty($(this).attr("id"))) {
        $(this).text("="+spreadsheet.formulas[$(this).attr("id")]);
        spreadsheet.formulas_checked = false;
      }
    })
    .on("focusout", "td", function() {
      $(".highlight").removeClass("highlight");
      if (!spreadsheet.formulas_checked) {
        spreadsheet.check_formulas();
      }
    });
});

// TESTING: these temporary functions stand in the place of the test harness.
// function save_data(key, data) {
//   console.log("saving key: "+key);
//   console.log("saving data: "+data);
//   spreadsheet.saved_sheets[key] = data;
// }
// function load_data(key) {
//   console.log("loading: ", key);
//   return spreadsheet.saved_sheets[key];
// }
