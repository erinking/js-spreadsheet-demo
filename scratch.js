// $(function() {
//   var focus = 0,
//   blur = 0;
//   $("#table").on("focusout", "td", function() {
//     focus++;
//     $( "#focus-count" ).text( "focusout fired: " + focus + "x" );
//   });
// });

// function generate_cells() {
//   for (var i = 0; i < 5; i++) {
//     $("#table").append("<tr id='row"+i+"'>");
//     rowi = $("#row"+i)[0];
//     for (var j = 0; j < 5; j++) {
//       $(rowi).append("<td id='"+j+""+i+"' contenteditable> </td>");
//     }
//     $("#table").append("</tr>");
//   }
// }

window.onload = function () {
  $("td").mousedown(function(click) {
    mouse_hold = true;
    $(".highlight").removeClass("highlight"); // clear previous selection
    click.preventDefault();
    $(this).addClass("highlight");
  });

  $("td").mousemove(function() {
    if (mouse_hold) {
      $(this).addClass("highlight");
    }
  });

  $(document).mouseup(function() {
    mouse_hold = false;
  });
}

///////////////////////////////////////////////////////////////////////////
$(function () {
  var mouse_hold = false,
    isHighlighted;
  $("#our_table td")
    .mousedown(function () {
      mouse_hold = true;
      $(this).toggleClass("highlighted");
      isHighlighted = $(this).hasClass("highlighted");
      return false; // prevent text selection
    })
    .mouseover(function () {
      if (mouse_hold) {
        $(this).toggleClass("highlighted", isHighlighted);
      }
    })
    .bind("selectstart", function () {
      return false;
    })

  $(document)
    .mouseup(function () {
      mouse_hold = false;
    });
});

//////////////////////////////////////////
    // "=" Key:
    else if  (code == 187) {
      parseFormula(cell);
    }
