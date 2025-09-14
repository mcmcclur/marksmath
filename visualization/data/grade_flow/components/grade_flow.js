import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";


export function make_grade_flow() {
    setup();
    // const container = d3.create('div')
    //     .style('width', '100%')
    //     .style('height', '200px')
    //     .style('border', 'solid 1px black');

    // return container.node()

    window.addEventListener('resize', setup);
}

function setup() {
    const main = d3.select('main');
    // const width = main.node().clientWidth;
    const width = 0.9*window.innerWidth;
    const height = 0.9*window.innerHeight;
    main.select('div#container')
        .style('width', `${width}px`)
        .style('height', `${height}px`)


    const text_pad = 25;
    const tb_pad = 20;
    const lr_pad = 60;


    // Two functions defined during d3.csv
    let get_count, add_link;

    // The part of the filter corresponding to the selected button.
    let global_filter;

    // The total number of folks in the node covered by mouseenter.
    let total;

    // The list of links and the link generator
    let link_data = [];
    const link = d3.linkHorizontal()
        .x(d => d.x)
        .y(d => d.y);

    // Read in the CSV file and set some things up.
    d3.csv('grades.csv').then(function(data) {
        const student_count = data.length;
        //var course_count = d3.set(data.map(d=>d.Course)).values().length;
        d3.select('#student_count').text(student_count)
        //d3.select('#course_count').text(course_count)

    // get_count computes the numbers displayed over the buttons
    // on mouseenter. It accepts a list of filters that look like:
    // [
    //   {
    //     'grade': grade,
    //     'column_name': column_name
    //   }, ...
    // ]
    get_count = function(filters) {
        var cases = data;
        var local_filters = filters;
        if(global_filter) {
            local_filters.push(global_filter);
        }
        console.log(['filters are ', global_filter, local_filters, filters])
        local_filters.forEach(function(d) {
            var column_to_check = d.column_name;
            var grade_to_check_for = d.grade;
            console.log(['cases are', cases])
            console.log(['and column_to_check is ', column_to_check])
            console.log(['since d is ', d])
            cases = cases.filter(function(dd) {
                return (dd[column_to_check].slice(0,1) == grade_to_check_for)
            })
        })
        return cases.length;
    }

  // Compute some counts to display in the page.
  var b_count = get_count([
    {
      'grade': 'B',
      'column_name': 'Grade 1'
    }
  ]);
  var b_then_a_count = get_count([
    {
      'grade': 'B',
      'column_name': 'Grade 1'
    },
    {
      'grade': 'A',
      'column_name': 'Final Grade'
    }
  ]);
  d3.select('#b_count').text(b_count)
  d3.select('#b_then_a_count').text(b_then_a_count)

  // Function to add a link connecting button 1 and button 2,
  // accounting for the selected button via the global_filter.
  add_link = function(grade1, grade2, column1, column2) {
    var button_info1 = button_info.filter(function(b) {
      return (b.grade == grade1) && (b.column_name == column1)
    })[0];
    var button_info2 = button_info.filter(function(b) {
      return (b.grade == grade2) && (b.column_name == column2)
    })[0];
    var count = get_count([
      {
        'grade': grade1,
        'column_name': column1
      },
      {
        'grade': grade2,
        'column_name': column2
      }
    ]);
    if(count > 0) {
      link_data.push({
        'source': {
          'x': button_info1.x, // + button_width/2,
          'y': button_info1.y //  - button_height/2
        },
        'target': {
          'x': button_info2.x, // - button_width/2,
          'y': button_info2.y // + button_height/2
        },
        'width': 10*Math.sqrt(count/total)
      })
    }
  }
});

// Set up the container and SVG
// The container will hold some buttons that are laid on
// top of the SVG. All text and decorations will take place
// within the SVG.
var container = d3.select('div.container')
  .style('width', width)
  .style('height', height)
  .style('justify-content', 'center')
var svg = d3.select("svg")
  .attr('width', width)
  .attr('height', height)

// Set up button_info which will hold placement and text
// information for the buttons.
var button_height = 0.12*height;
var button_width = 0.04*width;
var grade_matrix = [
  'A', 'A', 'A', 'A',
  'B', 'B', 'B', 'B',
  'C', 'C', 'C', 'C',
  'D', 'D', 'D', 'D',
  'F', 'F', 'F', 'F',
  'W', 'W', 'W', 'W'
];
var button_info = grade_matrix.map(function(g,i) {
  var result = {'grade': g};
  var left_x = lr_pad + button_width/2;
  var dx = (width - (2*lr_pad + button_width))/3;
  var x = left_x + (i%4)*dx;
  result['x'] = x;
  var top_y = text_pad + tb_pad + button_height/2;
  var dy = (height - text_pad - (2*tb_pad + button_height))/5;
  var y = top_y + Math.floor(i/4)*dy;
  result['y'] = y;
  var column_number = i%4+1;
  result['column_number'] = column_number;
  if(column_number < 4){
    var column_name = 'Grade ' + column_number.toString()
  }
  else {
    var column_name = 'Final Grade'
  }
  result['column_name'] = column_name;
  var id = g + column_number.toString();
  result['id'] = id;
  return result;
});


// Set up the descriptive text with location based on just
// the first four terms in button_info.
d3.select('svg')
  .append('g')
  .selectAll('text')
  .data(button_info.slice(0,4))
  .enter().append('text')
  .attr('text-anchor', 'middle')
  .attr('x', d => d.x)
  .attr('y', text_pad)
  .attr("text-decoration","underline")
  .text(function(o,i) {
    if(i < 3){
      return 'Grade ' + (i+1).toString()
    }
    else {
      return 'Final Grade'
    }
  });

// Lay the buttons down within the container on
// top of the SVG.
container
  .selectAll('button') 
  .data(button_info)
  .enter().append('button')
  .attr('class', 'btn btn-secondary')
  .style('top', d => `${(d.y - button_height/2)}px`)
  .style('left', d => `${(d.x - button_width/2)}px`)
  .style('height', `${button_height}px`)
  .style('width', `${button_width}px`)
  .text(d => d.grade)
  .attr('id', d => d.id)

  // Respone to mouseenter.
  .on('mouseenter', function(e, d) {
    console.log(['e on mouseenter is', e])
    // Figure out which button we're on, use it to define the
    // global_filter, the total number of selected students, and
    // the button_info itself (for placing the tooltip).
    var grade = d.grade;
    var selected_column = d.column_name;
    global_filter = {'grade': grade, 'column_name': selected_column};
    total = get_count([global_filter]);
    var selected_button = button_info.filter(function(bi) {
      return ((bi.grade == grade) &&
        (bi.column_name == selected_column))
    })[0];

    // Add the tooltip for the selected button.
    container.append("div")
        .attr("class", "tooltip")
        .html(total)
        .style('left', `${selected_button.x + 0.35*button_width}px`)
        .style('top', `${selected_button.y - 0.5*button_height}px`)

    // Compute and add the links. It's small enough that we'll
    // just iterate over all 3x6x6=108 possible links and add
    // one only when the count is positive.
    var column_pairs = [
      ['Grade 1', 'Grade 2'],
      ['Grade 2', 'Grade 3'],
      ['Grade 3', 'Final Grade']
    ];
    var possible_grades = ['A', 'B', 'C', 'D', 'F', 'W'];
    column_pairs.forEach(function(cp) {
      possible_grades.forEach(function(g) {
        possible_grades.forEach(function(gg) {
          add_link(g, gg, cp[0], cp[1]);
        })
      })
    });

    // Add the tooltips indicating the count for each node.
    var column_names = [
      'Grade 1', 'Grade 2',
      'Grade 3', 'Final Grade'
    ];
    column_names.forEach(function(cn) { 
      possible_grades.forEach(function(g) {
        if(cn != selected_column) {
          var count = get_count([
            {
              'grade': g,
              'column_name': cn
            },
            {
              'grade': grade,
              'column_name': selected_column
            }
          ]);
          if(count > 0) {
            var current_button = button_info.filter(function(bi) {
              return ((bi.grade == g) &&
                (bi.column_name == cn))
            })[0];
            d3.select(".container").append("div")
                .attr("class", "tooltip")
                .html(count)
                .style('left', `${current_button.x + 0.35*button_width}px`)
                .style('top', `${current_button.y - 0.5*button_height}px`)
          }
        }
      })
    });
    // Add the links!
    svg
      .selectAll('path')
      .data(link_data)
      .enter().append('path')
      .attr('d', link)
      .attr("stroke", "black")
      .attr("stroke-width", d=>d.width)
      .attr("fill",'none')
      .attr('class', 'link')
      .style('opacity', 0.5);
  })
  // Just remove some stuff on mouseleave.
  .on('mouseleave', function() {
    link_data = [];
    svg.selectAll('.link').remove();
    d3.selectAll('div.tooltip').remove();
  });
}



    