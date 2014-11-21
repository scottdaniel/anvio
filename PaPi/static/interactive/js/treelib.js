 /**
 *
 * Javascript library to display phylogenetic trees
 *
 */

//--------------------------------------------------------------------------------------------------
function createGroup(parent, group_id) {
    var svgObject = document.getElementById(parent);
    var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('id', group_id);
    svgObject.appendChild(g);
}

function drawLegend(top, left) {
    var legend_counter=0;
    for (var i = 0; i < categorical_data_ids.length; i++) {
        // collect categorical
        var pindex = categorical_data_ids[i];
        var categorical_data_title = metadata[0][pindex];

        var names = new Array();

        for (var name in categorical_data_colors[pindex]) {
            names.push(name);
        }

        names.sort();

        var group_id = 'legend_' + legend_counter;
        legend_counter++;

        createGroup('viewport', group_id);

        // draw border
        drawRectangle(group_id, left - 10, top - 20, (names.length + 2.5) * 20, 200, 'white', 1, 'black');

        drawText(group_id, {
            'x': left,
            'y': top
        }, categorical_data_title, '16px');

        for (var j = 0; j < names.length; j++) {
            var name = names[j];

            top = top + 20;
            var rect = drawRectangle(group_id, left, top, 16, 16, categorical_data_colors[pindex][name], 1, 'black',
                null,
                function() {
                    // mouseenter
                    $(this).css('stroke-width', '2');
                },
                function() {
                    // mouseleave
                    $(this).css('stroke-width', '1');
                });

            rect.setAttribute('callback_pindex', pindex);
            rect.setAttribute('callback_name', name);

            $(rect).colpick({
                layout: 'hex',
                submit: 0,
                colorScheme: 'light',
                onChange: function(hsb, hex, rgb, el, bySetColor) {
                    $(el).css('fill', '#' + hex);
                    categorical_data_colors[$(el).attr('callback_pindex')][$(el).attr('callback_name')] = '#' + hex;
                }
            });

            drawText(group_id, {
                'x': left + 30,
                'y': top + 8
            }, names[j], '12px');
        }
        top = top + 70;
    }

    for (var i = 0; i < stack_bar_ids.length; i++) {

        var pindex = stack_bar_ids[i];
        var stack_bar_title = metadata[0][pindex];

        var names = stack_bar_title.split(";");

        var group_id = 'legend_' + legend_counter;
        legend_counter++;

        createGroup('viewport', group_id);
        drawRectangle(group_id, left - 10, top - 20, (names.length + 2.5) * 20, 200, 'white', 1, 'black');
        drawText(group_id, {
            'x': left,
            'y': top
        }, stack_bar_title, '16px');

        for (var j = 0; j < names.length; j++) {
            var name = names[j];

            top = top + 20;
            var rect = drawRectangle(group_id, left, top, 16, 16, stack_bar_colors[pindex][j], 1, 'black',
                null,
                function() {
                    // mouseenter
                    $(this).css('stroke-width', '2');
                },
                function() {
                    // mouseleave
                    $(this).css('stroke-width', '1');
                });

            rect.setAttribute('callback_pindex', pindex);
            rect.setAttribute('callback_id', j);

            $(rect).colpick({
                layout: 'hex',
                submit: 0,
                colorScheme: 'light',
                onChange: function(hsb, hex, rgb, el, bySetColor) {
                    $(el).css('fill', '#' + hex);
                    stack_bar_colors[$(el).attr('callback_pindex')][parseInt($(el).attr('callback_id'))] = '#' + hex;
                }
            });

            drawText(group_id, {
                'x': left + 30,
                'y': top + 8
            }, names[j], '12px');
        }
        top = top + 70;

    }

}

function drawGroupLegend() {
    var left = 0 - total_radius - 300; // draw on the left top
    var top = 20 - total_radius;

    var groups_to_draw = new Array();
    for (var gid = 1; gid <= group_counter; gid++) {
        if(SELECTED[gid].length > 0) {
            groups_to_draw.push(gid);
        }
    }

    if (groups_to_draw.length==0)
        return;

    createGroup('viewport', 'group_legend');

    drawRectangle('group_legend', left - 10, top - 20, (groups_to_draw.length + 2.5) * 20, 200, 'white', 1, 'black');
    drawText('group_legend', {
        'x': left,
        'y': top
    }, "Groups", '16px');

    for (var j = 0; j < groups_to_draw.length; j++) {
        gid = groups_to_draw[j];
        top = top + 20;

        drawRectangle('group_legend', left, top, 16, 16, $('#group_color_' + gid).attr('color'), 1, 'black');
        drawText('group_legend', {
            'x': left + 30,
            'y': top + 8
        }, $('#group_name_' + gid).val(), '12px');
    }
}

function redrawGroupColors() {
    for (var gid = 1; gid <= group_counter; gid++) {
        
        // check if group exist
        var color_picker = document.getElementById('group_color_' + gid);

        if (!color_picker)
            continue;

        var group_color = color_picker.getAttribute('color');

        for (var j = 0; j < SELECTED[gid].length; j++) {
            if (id_to_node_map[SELECTED[gid][j]].IsLeaf()) {
                var _path_background = document.getElementsByClassName('path_' + SELECTED[gid][j] + '_background');
                for (var _i=0; _i < _path_background.length; _i++) {
                    _path_background[_i].style['fill'] = group_color;
                    _path_background[_i].style['fill-opacity'] = '0.1';      
                }

                var _path_outer_ring = document.getElementsByClassName('path_' + SELECTED[gid][j] + '_outer_ring');
                for (var _i=0; _i < _path_outer_ring.length; _i++) {
                    _path_outer_ring[_i].style['fill'] = group_color;    
                }
            }

            var _line = document.getElementById('line' + SELECTED[gid][j]);
            if (_line) {
                _line.style['stroke-width'] = '2';
                _line.style['stroke'] = group_color;       
            }

            var _arc = document.getElementById('arc' + SELECTED[gid][j]);
            if (_arc) {
                _arc.style['stroke-width'] = '2';
                _arc.style['stroke'] = group_color;
            }
        }
    }

}

function getGroupId() {
    var radios = document.getElementsByName('active_group');
    for(var i=0; i < radios.length; i++)
    {
        if (radios[i].checked)
            return radios[i].value;
    }
}

function lineClickHandler(event) {
    var p = id_to_node_map[event.target.id.match(/\d+/)[0]];

    var group_id = getGroupId();

    if (group_id < 1)
        return;

    var group_color = document.getElementById('group_color_' + group_id).getAttribute('color');;

    for (var i = 0; i < p.child_nodes.length; i++) {
        var pos = SELECTED[group_id].indexOf(p.child_nodes[i]);
        if (pos == -1) {
            SELECTED[group_id].push(p.child_nodes[i]);

            var _path_background = document.getElementsByClassName('path_' + p.child_nodes[i] + '_background');
            for (var _i=0; _i < _path_background.length; _i++) {
                _path_background[_i].style['fill'] = group_color;
                _path_background[_i].style['fill-opacity'] = '0.1';      
            }

            var _path_outer_ring = document.getElementsByClassName('path_' + p.child_nodes[i] + '_outer_ring');
            for (var _i=0; _i < _path_outer_ring.length; _i++) {
                _path_outer_ring[_i].style['fill'] = group_color;    
            }
        }

        // remove nodes from other groups
        for (var gid = 1; gid <= group_counter; gid++) {
            // don't remove nodes from current group
            if (gid == group_id)
                continue;

            var pos = SELECTED[gid].indexOf(p.child_nodes[i]);
            if (pos > -1) {
                SELECTED[gid].splice(pos, 1);
            }
        }
    }

    updateGroupWindow();
}

function lineContextMenuHandler(event) {
    if (event.preventDefault) event.preventDefault();
    var group_id = getGroupId();

    if (event.target.id.indexOf('path_') > -1) // if layer -> show popup
    {
        context_menu_target_id = event.target.id.replace('path_', '');

        $('#control_contextmenu').show();

        if (group_id > 0)
        {
            var pos = SELECTED[group_id].indexOf(parseInt(context_menu_target_id));

            if (pos == -1) {
                $('#control_contextmenu #select').show();
                $('#control_contextmenu #remove').hide();
            }
            else
            {
                $('#control_contextmenu #select').hide();
                $('#control_contextmenu #remove').show();                        
            }
        }
        else
        {
            $('#control_contextmenu #select').hide();
            $('#control_contextmenu #remove').hide();
        }

        $('#control_contextmenu').offset({left:event.pageX-2,top:event.pageY-2});
        return false;
    }

    var p = id_to_node_map[event.target.id.match(/\d+/)[0]];

    if (group_id < 1)
        return;

    for (var i = 0; i < p.child_nodes.length; i++) {
        var _path_background = document.getElementsByClassName('path_' + p.child_nodes[i] + '_background');
        for (var _i=0; _i < _path_background.length; _i++) {
            _path_background[_i].style['fill'] = '#FFFFFF';
            _path_background[_i].style['fill-opacity'] = '0.0';      
        }

        var _path_outer_ring = document.getElementsByClassName('path_' + p.child_nodes[i] + '_outer_ring');
        for (var _i=0; _i < _path_outer_ring.length; _i++) {
            _path_outer_ring[_i].style['fill'] = '#FFFFFF';    
        }

        // remove nodes from other groups
        for (var gid = 1; gid <= group_counter; gid++) {
            var pos = SELECTED[gid].indexOf(p.child_nodes[i]);
            if (pos > -1) {
                SELECTED[gid].splice(pos, 1);
            }
        }
    }
    updateGroupWindow();
    lineMouseLeaveHandler(event);
    return false;
}

function lineMouseEnterHandler(event) {
    var p = id_to_node_map[event.target.id.match(/\d+/)[0]];

    var group_id = getGroupId();

    if (group_id < 1)
        return;

    var group_color = document.getElementById('group_color_' + group_id).getAttribute('color');

    var p1 = p;
    while (p1.child) {
        p1 = p1.child;
    }

    var p2 = p;

    while (p2.child) {
        p2 = p2.child.GetRightMostSibling();
    }

    if (tree_type == 'circlephylogram')
    {
        drawPie('tree_group',
            'hover',
            p1.angle - angle_per_leaf / 2,
            p2.angle + angle_per_leaf / 2,
            distance(p.backarc, {
                'x': 0,
                'y': 0
            }),
            total_radius,
            (p2.angle - p1.angle + angle_per_leaf > Math.PI) ? 1 : 0,
            group_color,
            0.3,
            false);
    }
    else
    {  
        drawPhylogramRectangle('tree_group',
            'hover',
            p.ancestor.xy.x,
            (p1.xy.y + p2.xy.y) / 2,
            p2.xy.y - p1.xy.y + height_per_leaf,
            total_radius - p.ancestor.xy.x,
            group_color,
            0.3,
            false);
   }

    for (var index = 0; index < p.child_nodes.length; index++) {
        var _line = document.getElementById('line' + p.child_nodes[index]);
        if (_line) {
            _line.style['stroke-width'] = '3';
            _line.style['stroke'] = group_color;       
        }

        var _arc = document.getElementById('arc' + p.child_nodes[index]);
        if (_arc) {
            _arc.style['stroke-width'] = '3';
            _arc.style['stroke'] = group_color;
        }
    }
}

function lineMouseLeaveHandler(event) {
    var p = id_to_node_map[event.target.id.match(/\d+/)[0]];

    $('#path_hover').remove();

    var group_id = getGroupId();

    if (group_id < 1) {
        document.focus();
        return;
    }

    for (var index = 0; index < p.child_nodes.length; index++) {
        var _line = document.getElementById('line' + p.child_nodes[index]);
        if (_line) {
            _line.style['stroke-width'] = '1';       
        }

        var _arc = document.getElementById('arc' + p.child_nodes[index]);
        if (_arc) {
            _arc.style['stroke-width'] = '1';
        }
    }

    var node_stack = [];
    for (var gid = 1; gid <= group_counter; gid++) {
        var color_picker = document.getElementById('group_color_' + gid);

        if (!color_picker)
            continue;

        var group_color = color_picker.getAttribute('color');

        for (var i = 0; i < SELECTED[gid].length; i++) {
            node_stack.push(SELECTED[gid][i]);

            var _line = document.getElementById('line' + SELECTED[gid][i]);
            if (_line) {
                _line.style['stroke-width'] = '2';
                _line.style['stroke'] = group_color;       
            }

            var _arc = document.getElementById('arc' + SELECTED[gid][i]);
            if (_arc) {
                _arc.style['stroke-width'] = '2';
                _arc.style['stroke'] = group_color;
            }
        }
    }

    for (var i = 0; i < p.child_nodes.length; i++) {
        if (node_stack.indexOf(p.child_nodes[i]) > -1)
            continue;

        var _line = document.getElementById('line' + p.child_nodes[i]);
        if (_line) {
            _line.style['stroke'] = LINE_COLOR;       
        }

        var _arc = document.getElementById('arc' + p.child_nodes[i]);
        if (_arc) {
            _arc.style['stroke'] = LINE_COLOR;
        }
    }
}

function mouseMoveHandler(event) {
    var id = event.target.id.match(/path_(\d+)(_parent)?/);

    var tooltip = document.getElementById('aToolTip');
    if (tooltip)
        tooltip.parentNode.removeChild(tooltip);

    if (id)
    {
        id = id[1];

        var layer_id = event.target.parentNode.id.match(/\d+/)[0];

        var tooltip_arr = metadata_title[id_to_node_map[id].label].slice(0);
        tooltip_arr[layer_id] = '<font color="lime">' + tooltip_arr[layer_id] + '</font>';
        var message = tooltip_arr.join('<br />\n');

        var tooltip = document.createElement('div');
        tooltip.setAttribute('id', 'aToolTip');
        tooltip.setAttribute('class', 'defaultTheme');
        tooltip.innerHTML = "<p class='aToolTipContent'>"+message+"</p>";

        tooltip.style['top'] = (event.y+10) + 'px';
        tooltip.style['left'] = (event.x+10) + 'px';

        document.body.appendChild(tooltip);
    }

}

function drawLine(svg_id, p, p0, p1, isArc) {
    var line = document.createElementNS('http://www.w3.org/2000/svg', 'path');

    if (isArc) 
    {
        line.setAttribute('id', 'arc' + p.id);
    }
    else
    {
        line.setAttribute('id', 'line' + p.id);
    }

    line.setAttribute('vector-effect', 'non-scaling-stroke');
    line.setAttribute('style', 'stroke:' + LINE_COLOR + ';stroke-width:1;');
    line.setAttribute('d', linePath(p0, p1));

    var svg = document.getElementById(svg_id);
    svg.appendChild(line);
}

//--------------------------------------------------------------------------------------------------
function drawText(svg_id, p, string, font_size, align) {

    var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    //newLine.setAttribute('id','node' + p.id);
    text.setAttribute('style', 'alignment-baseline:middle');
    text.setAttribute('x', p['x']);
    text.setAttribute('y', p['y']);
    text.setAttribute('font-size', font_size);
    text.setAttribute('pointer-events', 'none');

    switch (align) {
        case 'left':
            text.setAttribute('text-anchor', 'start');
            break;
        case 'centre':
        case 'center':
            text.setAttribute('text-anchor', 'middle');
            break;
        case 'right':
            text.setAttribute('text-anchor', 'end');
            break;
        default:
            text.setAttribute('text-anchor', 'start');
            break;
    }

    var textNode = document.createTextNode(string)
    text.appendChild(textNode);

    var svg = document.getElementById(svg_id);
    svg.appendChild(text);
}

//--------------------------------------------------------------------------------------------------
function drawRotatedText(svg_id, p, string, angle, align, font_size) {
    var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    //newLine.setAttribute('id','node' + p.id);
    text.setAttribute('style', 'alignment-baseline:middle');
    text.setAttribute('x', p['x']);
    text.setAttribute('y', p['y']);
    text.setAttribute('pointer-events', 'none');
    text.setAttribute('font-size', font_size);

    switch (align) {
        case 'left':
            text.setAttribute('text-anchor', 'start');
            break;
        case 'centre':
        case 'center':
            text.setAttribute('text-anchor', 'middle');
            break;
        case 'right':
            text.setAttribute('text-anchor', 'end');
            break;
        default:
            text.setAttribute('text-anchor', 'start');
            break;
    }

    if (angle != 0) {
        text.setAttribute('transform', 'rotate(' + angle + ' ' + p['x'] + ' ' + p['y'] + ')');
    }

    var textNode = document.createTextNode(string)
    text.appendChild(textNode);

    var svg = document.getElementById(svg_id);
    svg.appendChild(text);
}

function drawStraightGuideLine(svg_id, id, xy, max_x)  {
    var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('id','guide' + id);

    line.setAttribute('x1', xy['x']);
    line.setAttribute('y1', xy['y']);
    line.setAttribute('x2', max_x);
    line.setAttribute('y2', xy['y']);

    line.setAttribute('stroke', LINE_COLOR);
    line.setAttribute('stroke-opacity', '0.2');
    line.setAttribute('vector-effect', 'non-scaling-stroke');
    line.setAttribute('stroke-width', '1');

    var svg = document.getElementById(svg_id);
    svg.appendChild(line);
}

function drawGuideLine(svg_id, id, angle, start_radius, end_radius) {
    var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('id','guide' + id);

    var ax = Math.cos(angle) * start_radius;
    var ay = Math.sin(angle) * start_radius;

    var bx = Math.cos(angle) * end_radius;
    var by = Math.sin(angle) * end_radius;

    line.setAttribute('x1', ax);
    line.setAttribute('y1', ay);
    line.setAttribute('x2', bx);
    line.setAttribute('y2', by); 

    line.setAttribute('stroke', LINE_COLOR);
    line.setAttribute('stroke-opacity', '0.2');
    line.setAttribute('vector-effect', 'non-scaling-stroke');
    line.setAttribute('stroke-width', '1');

    var svg = document.getElementById(svg_id);
    svg.appendChild(line);
}

function drawPie(svg_id, id, start_angle, end_angle, inner_radius, outer_radius, large_arc_flag, color, fill_opacity, pointer_events) {
    var pie = document.createElementNS('http://www.w3.org/2000/svg', 'path');

    if (start_angle > end_angle) {
        // swap 
        var t = end_angle;
        end_angle = start_angle;
        start_angle = t;
    }

    // origin
    var ox = 0;
    var oy = 0;

    // calculate points
    var ax = ox + Math.cos(start_angle) * inner_radius;
    var ay = ox + Math.sin(start_angle) * inner_radius;

    var bx = ox + Math.cos(end_angle) * inner_radius;
    var by = ox + Math.sin(end_angle) * inner_radius;

    var cx = ox + Math.cos(end_angle) * outer_radius;
    var cy = ox + Math.sin(end_angle) * outer_radius;

    var dx = ox + Math.cos(start_angle) * outer_radius;
    var dy = ox + Math.sin(start_angle) * outer_radius;

    // generate path string

    var path = new Array("M", ax, ay, // start point
        "A", inner_radius, inner_radius, 0, large_arc_flag, 1, bx, by, // inner arc
        "L", cx, cy, // line 1
        "A", outer_radius, outer_radius, 0, large_arc_flag, 0, dx, dy, // outer arc
        "Z"); // close path line 2

    pie.setAttribute('id', 'path_' + id);
    pie.setAttribute('class', 'path_' + id);
    pie.setAttribute('fill', color);
    pie.setAttribute('stroke-width', '0');
    pie.setAttribute('shape-rendering', 'auto');
    //pie.setAttribute('stroke', 'black');
    pie.setAttribute('d', path.join(" "));
    pie.setAttribute('fill-opacity', fill_opacity);

    if (!pointer_events)
        pie.setAttribute('pointer-events', 'none');

    var svg = document.getElementById(svg_id);
    svg.appendChild(pie);
}

function drawPhylogramRectangle(svg_id, id, x, y, height, width, color, fill_opacity, pointer_events) {
    var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');

    rect.setAttribute('id', 'path_' + id);
    rect.setAttribute('class', 'path_' + id);
    rect.setAttribute('fill', color);
    rect.setAttribute('stroke-width', 0);
    rect.setAttribute('fill-opacity', fill_opacity);

    rect.setAttribute('x', x);
    rect.setAttribute('y', y - height / 2); 
    rect.setAttribute('width', width);
    rect.setAttribute('height', height);

    if (!pointer_events)
        rect.setAttribute('pointer-events', 'none');

    var svg = document.getElementById(svg_id);
    svg.appendChild(rect);
}

function drawRectangle(svg_id, x, y, height, width, fill, stroke_width, stroke_color, f_click, f_mouseenter, f_mouseleave) {
    var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('fill', fill);
    rect.setAttribute('stroke-width', stroke_width);
    rect.setAttribute('stroke', stroke_color);

    rect.setAttribute('x', x);
    rect.setAttribute('y', y);
    rect.setAttribute('width', width);
    rect.setAttribute('height', height);

    $(rect).click(f_click);
    $(rect).mouseenter(f_mouseenter);
    $(rect).mouseleave(f_mouseleave);

    var svg = document.getElementById(svg_id);
    svg.appendChild(rect);

    return rect;
}

//--------------------------------------------------------------------------------------------------
function circeArcPath(p0, p1, radius, large_arc_flag) {
    var path = 'M ' + p0['x'] + ' ' + p0['y'] + ' A ' + radius + ' ' + radius + ' 0 ';

    if (large_arc_flag) {
        path += ' 1 ';
    } else {
        path += ' 0 ';
    }

    path += ' 1 ' + p1['x'] + ' ' + p1['y'];

    return path;
}

function drawCircleArc(svg_id, p, p0, p1, radius, large_arc_flag) {
    var arc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    arc.setAttribute('id', 'arc' + p.id);

    arc.setAttribute('vector-effect', 'non-scaling-stroke');
    arc.setAttribute('style', 'stroke:' + LINE_COLOR + ';stroke-width:1;');
    arc.setAttribute('fill', 'none');

    var path = circeArcPath(p0, p1, radius, large_arc_flag);
    arc.setAttribute('d', path)

    var svg = document.getElementById(svg_id);
    svg.appendChild(arc);
}

//--------------------------------------------------------------------------------------------------
function drawPath(svg_id, pathString) {
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    //newLine.setAttribute('id','node' + p.id);
    path.setAttribute('vector-effect', 'non-scaling-stroke');
    path.setAttribute('style', 'stroke:blue;stroke-width:1;');
    path.setAttribute('d', pathString);
    var svg = document.getElementById(svg_id);
    svg.appendChild(path);
}

//--------------------------------------------------------------------------------------------------
// Remove NEXUS-style string formatting, e.g. underscores
function formatString(s) {
    s = s.replace(/_/g, ' ');
    return s;
}

//--------------------------------------------------------------------------------------------------
// http://stackoverflow.com/questions/894860/set-a-default-parameter-value-for-a-javascript-function
function Node(label) {
    this.ancestor = null;
    this.child = null;
    this.sibling = null;
    this.label = typeof label !== 'undefined' ? label : '';
    this.id = 0;
    this.weight = 0;
    this.xy = [];
    this.edge_length = 0.0;
    this.path_length = 0.0;
    this.depth = 0;
}

//--------------------------------------------------------------------------------------------------
Node.prototype.IsLeaf = function() {
    return (!this.child);
}

//--------------------------------------------------------------------------------------------------
Node.prototype.GetRightMostSibling = function() {
    var p = this;
    while (p.sibling) {
        p = p.sibling;
    }
    return p;
}

//--------------------------------------------------------------------------------------------------
function Tree() {
    this.root = null;
    this.num_leaves = 0;
    this.num_nodes = 0;
    this.nodes = [];
    this.rooted = true;
    this.has_edge_lengths = false;
    this.error = 0;
}

//--------------------------------------------------------------------------------------------------
Tree.prototype.NewNode = function(label) {
    var node = new Node(label);
    node.id = this.num_nodes++;
    this.nodes[node.id] = node;
    id_to_node_map[node.id] = node;
    return node;
}

//--------------------------------------------------------------------------------------------------
Tree.prototype.Parse = function(str) {
    str = str.replace('"', "");

    // Strip NEXUS-style comments
    str = str.replace(/\[[^\[]+\]/g, "");

    str = str.replace(/\(/g, "|(|");
    str = str.replace(/\)/g, "|)|");
    str = str.replace(/,/g, "|,|");
    str = str.replace(/:/g, "|:|");
    str = str.replace(/;/g, "|;|");
    str = str.replace(/\|\|/g, "|");
    str = str.replace(/^\|/, "");
    str = str.replace(/\|$/, "");

    //console.log(str);

    var token = str.split("|");
    var curnode = this.NewNode();
    this.root = curnode;

    var state = 0;
    var stack = [];
    var i = 0;
    var q = null;

    var edge_length_norm = $('#edge_length_normalization')[0].checked;

    this.error = 0;

    while ((state != 99) && (this.error == 0)) {
        switch (state) {
            case 0:
                if (ctype_alnum(token[i].charAt(0))) {
                    this.num_leaves++;
                    label = token[i];
                    curnode.label = label;
                    i++;
                    state = 1;
                } else {
                    if (token[i].charAt(0) == "'") {
                        label = token[i];
                        label = label.replace(/^'/, "");
                        label = label.replace(/'$/, "");
                        this.num_leaves++;
                        curnode.label = label;
                        i++;
                        state = 1;
                    } else {
                        switch (token[i]) {
                            case '(':
                                state = 2;
                                break;

                            default:
                                state = 99;
                                this.error = 1; // syntax
                                break;
                        }

                    }
                }
                break;


            case 1: // getinternode
                switch (token[i]) {
                    case ':':
                    case ',':
                    case ')':
                        state = 2;
                        break;
                    default:
                        state = 99;
                        this.error = 1; // syntax
                        break;
                }
                break;

            case 2: // nextmove
                switch (token[i]) {
                    case ':':
                        i++;
                        if (isNumber(token[i])) {
                            // nnormalization of edge lengths
                            if (edge_length_norm) {
                                curnode.edge_length = Math.sqrt(parseFloat(token[i]) * 1000000) / 1000000;
                            } else {
                                curnode.edge_length = parseFloat(token[i]);
                            }
                            this.has_edge_lengths = true;
                            i++;
                        }
                        break;

                    case ',':
                        q = this.NewNode();
                        curnode.sibling = q;
                        var c = stack.length;
                        if (c == 0) {
                            state = 99;
                            this.error = 2; // missing (
                        } else {
                            q.ancestor = stack[c - 1];
                            curnode = q;
                            state = 0;
                            i++;
                        }
                        break;

                    case '(':
                        stack.push(curnode);
                        q = this.NewNode();
                        curnode.child = q;
                        q.ancestor = curnode;
                        curnode = q;
                        state = 0;
                        i++;
                        break;

                    case ')':
                        if (stack.length == 0) {
                            state = 99;
                            this.error = 3; // unbalanced
                        } else {
                            curnode = stack.pop();
                            state = 3;
                            i++;
                        }
                        break;

                    case ';':
                        if (stack.length == 0) {
                            state = 99;
                        } else {
                            state = 99;
                            this.error = 4; // stack not empty
                        }
                        break;

                    default:
                        state = 99;
                        this.error = 1; // syntax
                        break;
                }
                break;

            case 3: // finishchildren
                if (ctype_alnum(token[i].charAt(0))) {
                    curnode.label = token[i];
                    i++;
                } else {
                    switch (token[i]) {
                        case ':':
                            i++;
                            if (isNumber(token[i])) {
                                // nnormalization of edge lengths
                                if (edge_length_norm) {
                                    curnode.edge_length = Math.sqrt(parseFloat(token[i]) * 1000000) / 1000000;
                                } else {
                                    curnode.edge_length = parseFloat(token[i]);
                                }
                                this.has_edge_lengths = true;
                                i++;
                            }
                            break;

                        case ')':
                            if (stack.length == 0) {
                                state = 99;
                                this.error = 3; // unbalanced
                            } else {
                                curnode = stack.pop();
                                i++;
                            }
                            break;

                        case ',':
                            q = this.NewNode();
                            curnode.sibling = q;

                            if (stack.length == 0) {
                                state = 99;
                                this.error = 2; // missing (
                            } else {
                                q.ancestor = stack[stack.length - 1];
                                curnode = q;
                                state = 0;
                                i++;
                            }
                            break;

                        case ';':
                            state = 2;
                            break;

                        default:
                            state = 99;
                            this.error = 1; // syntax
                            break;
                    }
                }
                break;
        }
    }
}

//--------------------------------------------------------------------------------------------------
Tree.prototype.ComputeWeights = function(p) {
    if (p) {
        p.weight = 0;

        this.ComputeWeights(p.child);
        this.ComputeWeights(p.sibling);

        if (p.IsLeaf()) {
            p.weight = 1;
        }
        if (p.ancestor) {
            p.ancestor.weight += p.weight;
        }
    }
}

//--------------------------------------------------------------------------------------------------
Tree.prototype.ComputeDepths = function() {
    for (var i in this.nodes) {
        if (this.nodes[i].IsLeaf()) {
            p = this.nodes[i].ancestor;
            var count = 1;
            while (p) {
                p.depth = Math.max(p.depth, count);
                count++;
                p = p.ancestor;
            }
        }
    }
}

//--------------------------------------------------------------------------------------------------

function TreeDrawer() {
    //this.t = tree;

    this.leaf_count = 0;
    this.leaf_gap = 0;
    this.node_gap = 0;
    this.last_y = 0;

    this.svg_id;

    this.draw_scale_bar = false;
}

//--------------------------------------------------------------------------------------------------
TreeDrawer.prototype.Init = function(tree, settings) {
    this.t = tree;

    // defaults
    this.settings = settings;

    this.left = 0;
    this.top = 0;
    /*
    if (this.settings.fontHeight)
    {
        this.top += this.settings.fontHeight/2.0;
        this.settings.height -= this.settings.fontHeight;
    }
    */

}

//--------------------------------------------------------------------------------------------------
TreeDrawer.prototype.CalcInternal = function(p) {
    var pt = [];
    pt['x'] = this.left + this.node_gap * (this.t.num_leaves - p.weight);
    pt['y'] = this.last_y - ((p.weight - 1) * this.leaf_gap) / 2;
    p.xy = pt;
}

//--------------------------------------------------------------------------------------------------
TreeDrawer.prototype.CalcLeaf = function(p) {
    var pt = [];

    pt['y'] = this.top + (this.leaf_count * this.leaf_gap);
    this.last_y = pt['y'];
    this.leaf_count++;

    // slanted cladogram
    pt['x'] = this.left + this.settings.width;
    p.xy = pt;
}

//--------------------------------------------------------------------------------------------------
TreeDrawer.prototype.CalcNodeGap = function() {
    if (this.t.rooted) {
        this.node_gap = this.settings.width / this.t.num_leaves;
        this.left += this.node_gap;
        this.settings.width -= this.node_gap;
    } else {
        this.node_gap = this.settings.width / (this.t.num_leaves - 1);
    }
}


//--------------------------------------------------------------------------------------------------
TreeDrawer.prototype.CalcCoordinates = function() {
    this.t.ComputeWeights(this.t.root);

    this.leaf_count = 0;
    this.leaf_gap = this.settings.height / (this.t.num_leaves - 1);

    this.CalcNodeGap();

    var n = new NodeIterator(this.t.root);
    var q = n.Begin();
    while (q != null) {
        if (q.IsLeaf()) {
            this.CalcLeaf(q);
        } else {
            this.CalcInternal(q);
        }
        q = n.Next();
    }
}

//--------------------------------------------------------------------------------------------------
TreeDrawer.prototype.DrawLeaf = function(p) {
    var p0 = p.xy
    var anc = p.ancestor;
    if (anc) {
        var p1 = anc.xy;

        drawLine(this.settings.svg_id, p, p0, p1);
    }
}

//--------------------------------------------------------------------------------------------------
TreeDrawer.prototype.DrawInternal = function(p) {
    var p0 = p.xy
    var anc = p.ancestor;
    if (anc) {
        var p1 = anc.xy;
        drawLine(this.settings.svg_id, p, p0, p1);
    }
}

//--------------------------------------------------------------------------------------------------
TreeDrawer.prototype.DrawRoot = function() {
    var p0 = this.t.root.xy
    var p1 = [];
    p1['x'] = p0['x'];
    p1['y'] = p0['y'];
    p1['x'] -= this.node_gap;

    drawLine(this.settings.svg_id, this.t.root, p0, p1);
}

//--------------------------------------------------------------------------------------------------
TreeDrawer.prototype.Draw = function() {
    var n = new NodeIterator(this.t.root);
    var q = n.Begin();

    while (q != null) {
        if (q.IsLeaf()) {
            this.DrawLeaf(q);
        } else {
            this.DrawInternal(q);
        }
        q = n.Next();
    }
    if (this.t.rooted) {
        this.DrawRoot();
    }
}

//--------------------------------------------------------------------------------------------------
TreeDrawer.prototype.DrawLabels = function(nexus) {
    var nxs = typeof nexus !== 'undefined' ? nexus : null;

    var n = new NodeIterator(this.t.root);
    var q = n.Begin();
    while (q != null) {
        if (q.IsLeaf()) {
            var label = q.label;

            if (nxs) {
                if (nxs.treesblock.translate) {
                    if (nxs.treesblock.translate[label]) {
                        label = nxs.treesblock.translate[label];
                    }
                }
            }
            // offset 
            label_xy = q.xy;
            label_xy['x'] += this.settings.fontHeight / 2.0;

            drawText('viewport', label_xy, formatString(label));
        }
        q = n.Next();
    }
}

//--------------------------------------------------------------------------------------------------
RectangleTreeDrawer.prototype = new TreeDrawer();

function RectangleTreeDrawer() {
    TreeDrawer.apply(this, arguments);

    this.max_depth = 0;
};

//--------------------------------------------------------------------------------------------------
RectangleTreeDrawer.prototype.CalcInternal = function(p) {
    var pt = [];
    pt['x'] = this.left + this.node_gap * (this.t.root.depth - p.depth);

    var pl = p.child.xy;
    var pr = p.child.GetRightMostSibling().xy;

    pt['y'] = pl['y'] + (pr['y'] - pl['y']) / 2;
    p.xy['x'] = pt['x'];
    p.xy['y'] = pt['y'];
}

//--------------------------------------------------------------------------------------------------
RectangleTreeDrawer.prototype.CalcNodeGap = function() {
    this.t.ComputeDepths();
    //console.log(this.t.root.depth);
    if (this.t.rooted) {
        this.node_gap = this.settings.width / (this.t.root.depth + 1);
        this.left += this.node_gap;
        this.settings.width -= this.node_gap;
    } else {
        this.node_gap = this.settings.width / this.t.root.depth;
    }
}

//--------------------------------------------------------------------------------------------------
RectangleTreeDrawer.prototype.DrawLeaf = function(p) {
    var p0 = p.xy
    var p1 = [];
    var anc = p.ancestor;
    if (anc) {
        p1['x'] = anc.xy['x'];
        p1['y'] = p0['y'];

        drawLine(this.settings.svg_id, p, p0, p1);
    }
}

//--------------------------------------------------------------------------------------------------
RectangleTreeDrawer.prototype.DrawInternal = function(p) {
    var p0 = [];
    var p1 = [];

    p0['x'] = p.xy['x'];
    p0['y'] = p.xy['y'];

    var anc = p.ancestor;
    if (anc) {
        p1['x'] = anc.xy['x'];
        p1['y'] = p0['y'];

        drawLine(this.settings.svg_id, p, p0, p1);
    }

    // vertical line
    var pl = p.child.xy;
    var pr = p.child.GetRightMostSibling().xy;

    p0['x'] = p0['x'];
    p0['y'] = pl['y'];
    p1['x'] = p0['x'];
    p1['y'] = pr['y'];

    drawLine(this.settings.svg_id, p, p0, p1,true);
}


//--------------------------------------------------------------------------------------------------
PhylogramTreeDrawer.prototype = new RectangleTreeDrawer();

function PhylogramTreeDrawer() {
    RectangleTreeDrawer.apply(this, arguments);

    this.max_path_length = 0;
    this.draw_scale_bar = true;
};


//--------------------------------------------------------------------------------------------------
PhylogramTreeDrawer.prototype.CalcInternal = function(p) {
    var pt = [];
    pt['x'] = this.left + (p.path_length / this.max_path_length) * this.settings.width;

    var pl = p.child.xy;
    var pr = p.child.GetRightMostSibling().xy;

    pt['y'] = pl['y'] + (pr['y'] - pl['y']) / 2;
    p.xy['x'] = pt['x'];
    p.xy['y'] = pt['y'];
}

//--------------------------------------------------------------------------------------------------
PhylogramTreeDrawer.prototype.CalcLeaf = function(p) {
    var pt = [];
    pt['x'] = this.left + (p.path_length / this.max_path_length) * this.settings.width;

    pt['y'] = this.top + (this.leaf_count * this.leaf_gap);
    this.last_y = pt['y'];
    this.leaf_count++;

    p.xy['x'] = pt['x'];
    p.xy['y'] = pt['y'];

}


//--------------------------------------------------------------------------------------------------
PhylogramTreeDrawer.prototype.CalcCoordinates = function() {
    this.max_path_length = 0;
    //console.log(this.max_path_length);    

    this.t.root.path_length = this.t.root.edge_length;

    // build path lengths
    var n = new PreorderIterator(this.t.root);
    var q = n.Begin();
    while (q != null) {
        var d = q.edge_length;
        if (d < 0.00001) {
            d = 0.0;
        }
        if (q != this.t.root) {
            q.path_length = q.ancestor.path_length + d;
        }

        //console.log(q.label + ' ' + q.path_length + ' ' + q.edge_length);

        this.max_path_length = Math.max(this.max_path_length, q.path_length);
        q = n.Next();
    }

    //console.log(this.max_path_length);    

    this.leaf_count = 0;
    this.leaf_gap = this.settings.height / (this.t.num_leaves - 1);

    n = new NodeIterator(this.t.root);
    var q = n.Begin();
    while (q != null) {
        if (q.IsLeaf()) {
            this.CalcLeaf(q);
        } else {
            this.CalcInternal(q);
        }
        q = n.Next();
    }
}

//--------------------------------------------------------------------------------------------------
PhylogramTreeDrawer.prototype.Draw = function() {
    // parent method
    RectangleTreeDrawer.prototype.Draw.call(this);

    // scale bar
    if (this.draw_scale_bar) {
        this.DrawScaleBar();
    }
}

//--------------------------------------------------------------------------------------------------
PhylogramTreeDrawer.prototype.DrawScaleBar = function() {
    var p0 = [];
    var p1 = [];

    var m = log10(this.max_path_length);
    var i = Math.floor(m);
    var bar = Math.pow(10, i);

    var scalebar = (bar / this.max_path_length) * this.settings.width;

    p0['x'] = this.left;
    p0['y'] = this.top + this.settings.height + this.leaf_gap;

    p1['x'] = p0['x'] + scalebar;
    p1['y'] = p0['y'];

    //drawLine(this.settings.svg_id, 0, p0, p1);    
}



//--------------------------------------------------------------------------------------------------
CircleTreeDrawer.prototype = new RectangleTreeDrawer();

function CircleTreeDrawer() {
    RectangleTreeDrawer.apply(this, arguments);

    this.leaf_angle = 0;
    this.leaf_radius = 0;

    this.max_path_length = 0;
    this.root_length = 0;
};

//--------------------------------------------------------------------------------------------------
CircleTreeDrawer.prototype.CalcInternalRadius = function(p) {
    p.radius = this.node_gap * (this.t.root.depth - p.depth);
}

//--------------------------------------------------------------------------------------------------
CircleTreeDrawer.prototype.CalcInternal = function(p) {
    var left_angle = p.child.angle;
    var right_angle = p.child.GetRightMostSibling().angle;

    p.angle = left_angle + (right_angle - left_angle) / 2;

    this.CalcInternalRadius(p);

    var pt = [];
    pt['x'] = p.radius * Math.cos(p.angle);
    pt['y'] = p.radius * Math.sin(p.angle);

    p.xy['x'] = pt['x'];
    p.xy['y'] = pt['y'];

    var q = p.child;
    while (q) {
        pt = [];

        pt['x'] = p.radius * Math.cos(q.angle);
        pt['y'] = p.radius * Math.sin(q.angle);

        q.backarc = [];
        q.backarc['x'] = pt['x'];
        q.backarc['y'] = pt['y'];

        q = q.sibling;
    }
}


//--------------------------------------------------------------------------------------------------
CircleTreeDrawer.prototype.CalcLeafRadius = function(p) {
    p.radius = this.leaf_radius;
}

//--------------------------------------------------------------------------------------------------
CircleTreeDrawer.prototype.CalcLeaf = function(p) {
    var angle_min = Math.toRadians(parseFloat($('#angle-min').val()));
    p.angle = angle_min + this.leaf_angle * this.leaf_count;
    this.leaf_count++;

    this.CalcLeafRadius(p);

    var pt = [];
    pt['x'] = p.radius * Math.cos(p.angle);
    pt['y'] = p.radius * Math.sin(p.angle);

    p.xy['x'] = pt['x'];
    p.xy['y'] = pt['y'];
}

//--------------------------------------------------------------------------------------------------
CircleTreeDrawer.prototype.DrawLeaf = function(p) {

    var p0 = p.xy
    var p1 = p.backarc;

    drawLine(this.settings.svg_id, p, p0, p1);
}

//--------------------------------------------------------------------------------------------------
CircleTreeDrawer.prototype.DrawInternal = function(p) {
    var p0 = [];
    var p1 = [];

    p0['x'] = p.xy['x'];
    p0['y'] = p.xy['y'];

    var anc = p.ancestor;
    if (anc) {
        p0 = p.xy;
        p1 = p.backarc;

        drawLine(this.settings.svg_id, p, p0, p1);
    }

    // draw arc

    p0 = p.child.backarc;
    p1 = p.child.GetRightMostSibling().backarc;


    var large_arc_flag = (Math.abs(p.child.GetRightMostSibling().angle - p.child.angle) > Math.PI) ? true : false;
    drawCircleArc(this.settings.svg_id, p, p0, p1, p.radius, large_arc_flag);
}

//--------------------------------------------------------------------------------------------------
CircleTreeDrawer.prototype.DrawRoot = function() {
    var p0 = this.t.root.xy
    var p1 = [];
    p1['x'] = 0;
    p1['y'] = 0;


    drawLine(this.settings.svg_id, this.t.root, p0, p1);
}

//--------------------------------------------------------------------------------------------------
CircleTreeDrawer.prototype.CalcCoordinates = function() {
    this.t.ComputeDepths();

    this.max_path_length = 0;
    //console.log(this.max_path_length);    

    this.t.root.path_length = this.t.root.edge_length;

    // build path lengths
    var n = new PreorderIterator(this.t.root);
    var q = n.Begin();
    while (q != null) {
        var d = q.edge_length;
        if (d < 0.00001) {
            d = 0.0;
        }
        if (q != this.t.root) {
            q.path_length = q.ancestor.path_length + d;
        }

        //console.log(q.label + ' ' + q.path_length + ' ' + q.edge_length);

        this.max_path_length = Math.max(this.max_path_length, q.path_length);
        q = n.Next();
    }


    this.leaf_count = 0;

    var angle_max = parseFloat($('#angle-max').val());
    var angle_min = parseFloat($('#angle-min').val());

    this.leaf_angle = Math.toRadians(Math.abs(angle_max - angle_min)) / this.t.num_leaves;
    //this.leaf_angle = 2 * Math.PI / this.t.num_leaves;

    this.leaf_radius = this.settings.width / 2;
    this.node_gap = this.leaf_radius / this.t.root.depth;


    n = new NodeIterator(this.t.root);
    var q = n.Begin();
    while (q != null) {
        if (q.IsLeaf()) {
            this.CalcLeaf(q);
        } else {
            this.CalcInternal(q);
        }
        q = n.Next();
    }
}

//--------------------------------------------------------------------------------------------------
CircleTreeDrawer.prototype.Draw = function() {
    // parent method
    TreeDrawer.prototype.Draw.call(this);

    // move drawing to centre of viewport
    var viewport = document.getElementById(this.settings.svg_id);
    viewport.setAttribute('transform', 'translate(' + (this.settings.width + this.root_length) / 2 + ' ' + this.settings.height / 2 + ')');
}

//--------------------------------------------------------------------------------------------------
CircleTreeDrawer.prototype.DrawLabels = function(nexus) {
    var nxs = typeof nexus !== 'undefined' ? nexus : null;

    var n = new NodeIterator(this.t.root);
    var q = n.Begin();
    while (q != null) {
        if (q.IsLeaf()) {
            var label = q.label;

            if (nxs) {
                if (nxs.treesblock.translate) {
                    if (nxs.treesblock.translate[label]) {
                        label = nxs.treesblock.translate[label];
                    }
                }
            }

            var align = 'left';
            var angle = q.angle * 180.0 / Math.PI;
            if ((q.angle > Math.PI / 2.0) && (q.angle < 1.5 * Math.PI)) {
                align = 'right';
                angle += 180.0;
            }

            // offset label 
            var r = q.radius + this.settings.fontHeight / 2.0;
            var label_xy = [];
            label_xy['x'] = Math.cos(q.angle) * r;
            label_xy['y'] = Math.sin(q.angle) * r;

            drawRotatedText('viewport', label_xy, formatString(label), angle, align);
        }
        q = n.Next();
    }
}


//--------------------------------------------------------------------------------------------------
CirclePhylogramDrawer.prototype = new CircleTreeDrawer();

function CirclePhylogramDrawer() {
    CircleTreeDrawer.apply(this, arguments)

    this.max_path_length = 0;
    this.draw_scale_bar = true;
};


//--------------------------------------------------------------------------------------------------
CirclePhylogramDrawer.prototype.CalcInternalRadius = function(p) {
    p.radius = this.root_length + (p.path_length / this.max_path_length) * (this.settings.width / 2)
}

//--------------------------------------------------------------------------------------------------
CirclePhylogramDrawer.prototype.CalcLeafRadius = function(p) {
    p.radius = this.root_length + (p.path_length / this.max_path_length) * (this.settings.width / 2)
}

//--------------------------------------------------------------------------------------------------
CirclePhylogramDrawer.prototype.CalcCoordinates = function() {
    this.max_path_length = 0;
    //console.log(this.max_path_length);    

    if (this.settings.root_length) {
        this.root_length = this.settings.root_length * (this.settings.width / 2);
        this.settings.width -= 2 * this.root_length;
    }

    this.t.root.path_length = this.t.root.edge_length;

    // build path lengths
    var n = new PreorderIterator(this.t.root);
    var q = n.Begin();
    while (q != null) {
        var d = q.edge_length;
        if (d < 0.00001) {
            d = 0.0;
        }
        if (q != this.t.root) {
            q.path_length = q.ancestor.path_length + d;
        }

        this.max_path_length = Math.max(this.max_path_length, q.path_length);
        q = n.Next();
    }

    this.leaf_count = 0;
    var angle_max = parseFloat($('#angle-max').val());
    var angle_min = parseFloat($('#angle-min').val());

    this.leaf_angle = Math.toRadians(Math.abs(angle_max - angle_min)) / this.t.num_leaves;
    //this.leaf_angle = 2 * Math.PI / this.t.num_leaves;

    n = new NodeIterator(this.t.root);
    var q = n.Begin();
    while (q != null) {
        if (q.IsLeaf()) {
            this.CalcLeaf(q);
        } else {
            this.CalcInternal(q);
        }
        q = n.Next();
    }
}

//--------------------------------------------------------------------------------------------------
CirclePhylogramDrawer.prototype.Draw = function() {
    // parent method
    TreeDrawer.prototype.Draw.call(this);

    // move drawing to centre of viewport
    //var viewport = document.getElementById(this.settings.svg_id);
    //viewport.setAttribute('transform', 'translate(' + (this.settings.width + this.root_length) / 2 + ' ' + this.settings.height / 2 + ')');
}

function reorderLayers() {
    /*
    -  order steps:
    -  find order map
    -  change id arrays (categorical_data_ids, stack_bar_ids + color arrays)
    -  swap metadata columns 
    -  give new id to ui elements on table
    -  rest of the code should work
    */

    var order_map = {};
    var reverse_order_map = {};
    $('#tbody_layers tr').each(function(index,element) {
        //heightX is common in each row
        var index = index + 1;
        var old_index = parseInt($(element).find("input[type=text]").attr("id").replace("height", ""));

        order_map[old_index] = index;
        reverse_order_map[index] = old_index;
    });

    metadata_swap_log.push(order_map);
    metadata_swap_log_reverse.push(reverse_order_map);

    // convert categorical data arrays
    var new_categorical_data_colors = new Array();
    for (var i=0; i < categorical_data_ids.length; i++)
    {
        var old_index = categorical_data_ids[i];
        var new_index = order_map[categorical_data_ids[i]];

        categorical_data_ids[i] = new_index;
        new_categorical_data_colors[new_index] = categorical_data_colors[old_index];
    }
    categorical_data_colors = new_categorical_data_colors.splice(0);

    // convert stack bar arrays
    var new_stack_bar_colors = new Array();
    for (var i=0; i < stack_bar_ids.length; i++)
    {
        var old_index = stack_bar_ids[i];
        var new_index = order_map[stack_bar_ids[i]];

        stack_bar_ids[i] = new_index;
        new_stack_bar_colors[new_index] = stack_bar_colors[old_index];
    }
    stack_bar_colors = new_stack_bar_colors.splice(0);

    // swap metadata columns
    for (var i=0; i < metadata.length; i++)
    {
        var new_line = new Array();
        new_line.push(metadata[i][0]);

        for (var pindex = 1; pindex < parameter_count; pindex++)
        {
            new_line.push(metadata[i][reverse_order_map[pindex]]);
        }

        metadata[i] = new_line.splice(0);
    }

    // give new ids to ui elements
    $('#tbody_layers tr').each(function(index,element) {
        $(element).find(".input-height").attr("id", "height" + (index+1));
        $(element).find(".input-min").attr("id", "min" + (index+1));
        $(element).find(".input-max").attr("id", "max" + (index+1));
        $(element).find("select").attr("id", "normalization" + (index+1));
        $(element).find(".colorpicker").attr("id", "picker" + (index+1));
    });
}

function draw_tree(drawing_type) {

    id_to_node_map = new Array();
    var t = new Tree();

    newick = newick.trim(newick);
    t.Parse(newick);

    // call order function 
    reorderLayers();

    // generate tooltip text before normalization
    metadata_dict = new Array();

    for (var index = 1; index < metadata.length; index++) 
    {
        var params = metadata[index];
        metadata_dict[params[0]] = params.slice(0);

        var title = [];
        title.push("<b>" + metadata[index][0] + "</b>");
        for (var pindex = 1; pindex < params.length; pindex++) 
        {
            if (has_parent_layer && pindex==1) 
            {   
                if (metadata[index][pindex] == '')
                {
                    title.push("<b>Parent: </b>n/a");
                }
                else
                {
                    title.push("<b>Parent: </b>" + metadata[index][pindex]);
                }
                
            }
            else
            {
                title.push("<b>" + metadata[0][pindex] + ": </b>" + metadata[index][pindex]);
            }
        }

        metadata_title[params[0]] = title;
    }

    // normalization
    var param_max = new Array();

    for (var id in metadata_dict) 
    {
        for (var pindex = 1; pindex < parameter_count; pindex++) 
        {
            if (has_parent_layer && pindex==1) // skip normalization for parent layer
            {
                continue;
            }    
            if (categorical_data_ids.indexOf(pindex) > -1) // categorical data
            {
                continue;
            }
            if (stack_bar_ids.indexOf(pindex) > -1) // stack bar
            {
                // convert ";" string to array after normalization
                var stack_bar_items = metadata_dict[id][pindex].split(";");

                if ($('#normalization' + pindex).val() == 'sqrt') {
                    for (var j=0; j < stack_bar_items.length; j++)
                    {
                        stack_bar_items[j] = Math.sqrt(parseFloat(stack_bar_items[j]));
                    }
                }
                if ($('#normalization' + pindex).val() == 'log') {
                    for (var j=0; j < stack_bar_items.length; j++)
                    {
                        stack_bar_items[j] = log10(parseFloat(stack_bar_items[j]) + 1);
                    }
                }

                metadata_dict[id][pindex] = stack_bar_items.slice(0);
                continue;
            }

            // numerical data
            if ($('#normalization' + pindex).val() == 'sqrt') 
            {
                metadata_dict[id][pindex] = Math.sqrt(parseFloat(metadata_dict[id][pindex]));
            }
            if ($('#normalization' + pindex).val() == 'log') 
            {
                metadata_dict[id][pindex] = log10(parseFloat(metadata_dict[id][pindex]) + 1);
            }
            if (typeof param_max[pindex] === 'undefined' || parseFloat(metadata_dict[id][pindex]) > parseFloat(param_max[pindex])) 
            {
                param_max[pindex] = parseFloat(metadata_dict[id][pindex]);
            }
        }
    }

    // calculate bar sizes according to given height
    for (var pindex = 1; pindex < parameter_count; pindex++) 
    {
        if (has_parent_layer && pindex==1) // skip normalization for parent layer
        {
            continue;
        }
        else if (categorical_data_ids.indexOf(pindex) > -1) // categorical data
        {
            continue;
        }
        else
        {
            var min_max_disabled = $('#min' + pindex).prop('disabled');

            var min = parseFloat($('#min' + pindex).val());
            var max = parseFloat($('#max' + pindex).val());

            var min_new = null;
            var max_new = null;

            for (var id in metadata_dict)
            {
                if (stack_bar_ids.indexOf(pindex) > -1) // stack bar
                {
                    var total = 0;

                    for (var j=0; j < metadata_dict[id][pindex].length; j++)
                    {
                        total = total + parseFloat(metadata_dict[id][pindex][j]);
                    }

                    var multiplier = parseFloat($('#height' + pindex).val()) / total;

                    for (var j=0; j < metadata_dict[id][pindex].length; j++)
                    {
                        metadata_dict[id][pindex][j] = metadata_dict[id][pindex][j] * multiplier;
                    }
                }
                else // numerical data
                {
                    var bar_size = parseFloat(metadata_dict[id][pindex]);
                                        
                    if (!min_max_disabled)
                    {
                        if (bar_size > max) {
                            bar_size = max - min;
                        }
                        else if (bar_size < min) {
                            bar_size = 0;
                        }
                        else {
                            bar_size = bar_size - min;
                        }

                        metadata_dict[id][pindex] = bar_size *  parseFloat($('#height' + pindex).val()) / (max - min);
                    }
                    else
                    {  
                        if ((min_new == null) || bar_size < min_new) {
                            min_new = bar_size;
                        }
                        
                        if ((max_new == null) || bar_size > max_new) {
                            max_new = bar_size;
                        }

                        metadata_dict[id][pindex] = bar_size *  parseFloat($('#height' + pindex).val()) / param_max[pindex];
                    }
                }
            }

            if (min_max_disabled)
            {
                $('#min' + pindex).prop('disabled', false);
                $('#max' + pindex).val(max_new).prop('disabled', false);        
            }

            var min_max_str = "Min: " + min_new + " - Max: " + max_new;
            $('#min' + pindex).attr('title', min_max_str);
            $('#max' + pindex).attr('title', min_max_str);

        }
    }


    if (t.error != 0) {
        alert('Error parsing tree');
    } else {
        t.ComputeWeights(t.root);

        var td = null;

        // clear existing diagram, if any
        var svg = document.getElementById('svg');
        while (svg.hasChildNodes()) {
            svg.removeChild(svg.lastChild);
        }

        // create new group
        createGroup('svg', 'viewport');
        createGroup('viewport', 'tree_group');
        createGroup('tree_group', 'tree');

        switch (drawing_type) {
            case 'phylogram':
                if (t.has_edge_lengths) {
                    td = new PhylogramTreeDrawer();
                } else {
                    td = new RectangleTreeDrawer();
                }
                td.Init(t, {
                    svg_id: 'tree',
                    width: VIEWER_HEIGHT,
                    height: VIEWER_WIDTH,
                    fontHeight: 10,
                    root_length: 0.1
                });
                $('#tree_group').attr('transform', 'rotate(90)');
                break;

            case 'circlephylogram':
                if (t.has_edge_lengths) {
                    td = new CirclePhylogramDrawer();
                } else {

                    td = new CircleTreeDrawer();
                }
                td.Init(t, {
                    svg_id: 'tree',
                    width: VIEWER_WIDTH,
                    height: VIEWER_HEIGHT,
                    fontHeight: 10,
                    root_length: 0.1
                });
                break;
        }

        td.CalcCoordinates();
        td.Draw();

        // calculate max radius of tree
        var layer_boundaries = new Array();
        var tree_radius = 0;
        var tree_max_x = 0;
        var tree_max_y = 0;

        var n = new NodeIterator(t.root);
        var q = n.Begin();

        switch (drawing_type) {
            case 'phylogram':
                while (q != null)
                {
                    if (q.xy.x > tree_max_x)
                        tree_max_x = q.xy.x;
                    if (q.xy.y > tree_max_y)
                        tree_max_y = q.xy.y;

                    // childs
                    var _n = new NodeIterator(q);
                    var _q = _n.Begin();

                    q.child_nodes = [];
                    while (_q != null) {
                        q.child_nodes.push(_q.id);
                        _q = _n.Next();
                    }
                    // end of childs

                    q = n.Next();

                }
                layer_boundaries.push( [0, tree_max_x] );
                
                // calculate height per leaf
                height_per_leaf = VIEWER_WIDTH / (t.num_leaves - 1);

                break;

            case 'circlephylogram':
                while (q != null) 
                {
                    if (q.radius > tree_radius)
                        tree_radius = q.radius;

                    // childs
                    var _n = new NodeIterator(q);
                    var _q = _n.Begin();

                    q.child_nodes = [];
                    while (_q != null) {
                        q.child_nodes.push(_q.id);
                        _q = _n.Next();
                    }
                    // end of childs

                    q = n.Next();
                }
                layer_boundaries.push( [0, tree_radius] );

                // calculate angle per leaf
                var angle_max = parseFloat($('#angle-max').val());
                var angle_min = parseFloat($('#angle-min').val());
                angle_per_leaf = Math.toRadians(angle_max - angle_min) / t.num_leaves;
                break;
        }  
        
        var margin = parseFloat($('#layer-margin').val());

        // calculate layer boundries
        for (var pindex = 1; pindex < parameter_count; pindex++) {

            var isParent = (pindex == 1 && has_parent_layer) ? true : false;
            var isCategorical = categorical_data_ids.indexOf(pindex) > -1 ? true : false;
            var isStackBar = stack_bar_ids.indexOf(pindex) > -1 ? true : false;

            var layer_margin = (parseFloat($('#height' + pindex).val())==0) ? 0 : margin;

            if (isParent) // make parent layer a bit thinner than the rest.
            {
                // FIXME: for now the scaling factor is 3, but it would be nice if this was                               v
                // parameterized:
                layer_boundaries.push( [ layer_boundaries[pindex-1][1] + margin, layer_boundaries[pindex-1][1] + margin * 3 ] );
            } else {
                layer_boundaries.push( [ layer_boundaries[pindex-1][1] + layer_margin, layer_boundaries[pindex-1][1] + layer_margin + parseFloat($('#height' + pindex).val()) ] );
            }
            createGroup('tree_group', 'layer_' + pindex);
            createGroup('tree_group', 'layer_background_' + pindex);

            if (drawing_type=='phylogram' && !isParent && !isCategorical && !isStackBar) // draw numerical bar backgroung for phylogram
            {
                var color = color = $('#picker' + pindex).attr('color');

                drawPhylogramRectangle('layer_background_' + pindex,
                    'all',
                    layer_boundaries[pindex][0],
                    tree_max_y / 2,
                    tree_max_y + height_per_leaf,
                    layer_boundaries[pindex][1] - layer_boundaries[pindex][0],
                    color,
                    0.3,
                    false);
            }
        }

        total_radius = layer_boundaries[layer_boundaries.length - 1][1];
        beginning_of_layers = layer_boundaries[0][1];

        // label leaves...

        var n = new NodeIterator(t.root);
        var q = n.Begin();

        createGroup('tree_group', 'guide_lines');

        // parent things
        var parent_odd = '#888888';
        var parent_even = '#666666';
        var parent_residual = '#AAAAAA';
        var prev_parent_color = parent_odd;
        var prev_parent_name = '';
        var prev_parent_items = new Array();
        var parent_count = 0;

        odd_even_flag = -1

        switch (drawing_type) {
            case 'phylogram':
                while (q != null) {
                    if (q.IsLeaf()) {
                        odd_even_flag = odd_even_flag * -1;

                        if (odd_even_flag > 0)
                            drawStraightGuideLine('guide_lines', q.id, q.xy, tree_max_x);

                        for (var pindex = 1; pindex < parameter_count; pindex++) {

                            var isParent = (pindex == 1 && has_parent_layer) ? true : false;
                            var isCategorical = categorical_data_ids.indexOf(pindex) > -1 ? true : false;
                            var isStackBar = stack_bar_ids.indexOf(pindex) > -1 ? true : false;

                            if(isStackBar)
                            {
                                var offset = 0;
                                for (var j=0; j < metadata_dict[q.label][pindex].length; j++)
                                {
                                    drawPhylogramRectangle('layer_' + pindex,
                                        q.id,
                                        layer_boundaries[pindex][1] - offset - metadata_dict[q.label][pindex][j],
                                        q.xy['y'],
                                        height_per_leaf,
                                        metadata_dict[q.label][pindex][j],
                                        stack_bar_colors[pindex][j],
                                        1,
                                        true);
                                    offset += metadata_dict[q.label][pindex][j];
                                } 
                        
                            }
                            else if(isCategorical)
                            {
                                if (typeof categorical_data_colors[pindex][metadata_dict[q.label][pindex]] === 'undefined')
                                    categorical_data_colors[pindex][metadata_dict[q.label][pindex]] = randomColor();

                                var color = categorical_data_colors[pindex][metadata_dict[q.label][pindex]];

                                drawPhylogramRectangle('layer_' + pindex,
                                    q.id,
                                    layer_boundaries[pindex][0],
                                    q.xy['y'],
                                    height_per_leaf,
                                    layer_boundaries[pindex][1] - layer_boundaries[pindex][0],
                                    color,
                                    1,
                                    true);
                            }
                            else if (isParent)
                            {
                                if (metadata_dict[q.label][1] == '')
                                    continue;

                                var color = prev_parent_color;

                                if (prev_parent_name != metadata_dict[q.label][1])
                                {
                                    if (prev_parent_color == parent_odd)
                                    {
                                        var color = parent_even;
                                    }
                                    else
                                    {
                                        var color = parent_odd;
                                    }
                                    prev_parent_items = new Array();
                                    parent_count++;
                                }
                                drawPhylogramRectangle('layer_' + pindex,
                                    q.id + "_parent",
                                    layer_boundaries[pindex][0],
                                    q.xy['y'],
                                    height_per_leaf,
                                    layer_boundaries[pindex][1] - layer_boundaries[pindex][0],
                                    color,
                                    1,
                                    true);

                                prev_parent_color = color;
                                prev_parent_name = metadata_dict[q.label][1];
                                prev_parent_items.push(q.id + "_parent");
                            }
                            else // numerical
                            {
                                var color = color = $('#picker' + pindex).attr('color');

                                 drawPhylogramRectangle('layer_' + pindex,
                                    q.id,
                                    layer_boundaries[pindex][1] - metadata_dict[q.label][pindex],
                                    q.xy['y'],
                                    height_per_leaf,
                                    metadata_dict[q.label][pindex],
                                    color,
                                    1,
                                    true);
                            }

                        }

                        drawPhylogramRectangle('tree_group',
                            q.id + "_background",
                            layer_boundaries[0][1],
                            q.xy['y'],
                            height_per_leaf,
                            total_radius + margin - layer_boundaries[0][1],
                            '#FFFFFF',
                            0.0,
                            false);

                        drawPhylogramRectangle('tree_group',
                            q.id + "_outer_ring",
                            total_radius + margin,
                            q.xy['y'],
                            height_per_leaf,
                            margin * 4,
                            '#FFFFFF',
                            1,
                            false);
                    }
                    q = n.Next();
                }
                break;
            case 'circlephylogram':
                while (q != null) {
                    if (q.IsLeaf()) {
                        odd_even_flag = odd_even_flag * -1;

                        // draw guidelines for every other leaf.
                        if (odd_even_flag > 0)
                            drawGuideLine('guide_lines', q.id, q.angle, q.radius, beginning_of_layers);

                        for (var pindex = 1; pindex < parameter_count; pindex++) {

                            var isParent = (pindex == 1 && has_parent_layer) ? true : false;
                            var isCategorical = categorical_data_ids.indexOf(pindex) > -1 ? true : false;
                            var isStackBar = stack_bar_ids.indexOf(pindex) > -1 ? true : false;

                            if(isStackBar)
                            {
                                var offset = 0;
                                for (var j=0; j < metadata_dict[q.label][pindex].length; j++)
                                {
                                    drawPie('layer_' + pindex,
                                        q.id,
                                        q.angle - angle_per_leaf / 2,
                                        q.angle + angle_per_leaf / 2,
                                        layer_boundaries[pindex][0] + offset,
                                        layer_boundaries[pindex][0] + offset + metadata_dict[q.label][pindex][j],
                                        0,
                                        stack_bar_colors[pindex][j],
                                        1,
                                        true);
                                    offset += metadata_dict[q.label][pindex][j];
                                } 
                        
                            }
                            else if(isCategorical)
                            {
                                if (typeof categorical_data_colors[pindex][metadata_dict[q.label][pindex]] === 'undefined')
                                    categorical_data_colors[pindex][metadata_dict[q.label][pindex]] = randomColor();

                                var color = categorical_data_colors[pindex][metadata_dict[q.label][pindex]];

                                drawPie('layer_' + pindex,
                                    q.id,
                                    q.angle - angle_per_leaf / 2,
                                    q.angle + angle_per_leaf / 2,
                                    layer_boundaries[pindex][0], 
                                    layer_boundaries[pindex][1],
                                    0,
                                    color,
                                    1,
                                    true);
                            }
                            else if (isParent)
                            {
                                if (metadata_dict[q.label][1] == '')
                                    continue;

                                var color = prev_parent_color;

                                if (prev_parent_name != metadata_dict[q.label][1])
                                {
                                    if (prev_parent_color == parent_odd)
                                    {
                                        var color = parent_even;
                                    }
                                    else
                                    {
                                        var color = parent_odd;
                                    }
                                    prev_parent_items = new Array();
                                    parent_count++;
                                }

                                drawPie('layer_' + pindex,
                                    q.id + "_parent",
                                    q.angle - angle_per_leaf / 2,
                                    q.angle + angle_per_leaf / 2,
                                    layer_boundaries[pindex][0], 
                                    layer_boundaries[pindex][1],
                                    0,
                                    color,
                                    1,
                                    true);

                                prev_parent_color = color;
                                prev_parent_name = metadata_dict[q.label][1];
                                prev_parent_items.push(q.id + "_parent");
                            }
                            else // numerical
                            {
                                var color = color = $('#picker' + pindex).attr('color');

                                drawPie('layer_background_' + pindex,
                                    q.id,
                                    q.angle - angle_per_leaf / 2,
                                    q.angle + angle_per_leaf / 2,
                                    layer_boundaries[pindex][0],
                                    layer_boundaries[pindex][1],
                                    0,
                                    color,
                                    0.3,
                                    true);

                                drawPie('layer_' + pindex,
                                    q.id,
                                    q.angle - angle_per_leaf / 2,
                                    q.angle + angle_per_leaf / 2,
                                    layer_boundaries[pindex][0], 
                                    layer_boundaries[pindex][0] + metadata_dict[q.label][pindex],
                                    0,
                                    color,
                                    1,
                                    true);
                            }

                        }

                        drawPie('viewport',
                            q.id + "_background",
                            q.angle - angle_per_leaf / 2,
                            q.angle + angle_per_leaf / 2,
                            layer_boundaries[0][1],
                            total_radius + margin,
                            0,
                            '#FFFFFF',
                            0.0,
                            false); 

                        drawPie('viewport',
                            q.id + "_outer_ring",
                            q.angle - angle_per_leaf / 2,
                            q.angle + angle_per_leaf / 2,
                            total_radius + margin,
                            // FIXME: for now the scaling factor is 4, but obviously this should be
                            // parameterized at some point:
                            total_radius + margin * 4,
                            0,
                            '#FFFFFF',
                            1,
                            false); 
                    }
                    q = n.Next();
                }
                break;
        }

        // parent count odd-even check
        
        if ((parent_count % 2) == 1)
        {
            for (var i = 0; i < prev_parent_items.length; i++)
            {
                $('#path_' + prev_parent_items[i]).css('fill', parent_residual);
            }
        }

        switch (drawing_type) {
            case 'phylogram':
                drawLegend(0, 100);
                drawText('viewport', {'x': -0.5 * td.settings.height, 'y': -100}, project_title, '72px', 'center');
                break;
            case 'circlephylogram':
                drawLegend(20 - total_radius, total_radius + 100);
                drawText('viewport', {'x': 0, 'y': -1 * total_radius - 100}, project_title, '72px', 'center');
                break;
        }


        redrawGroupColors();

        // Scale to fit window
        var bbox = svg.getBBox();
        var scale = Math.min(td.settings.width / bbox.width, td.settings.height / bbox.height) * 0.75;
        SCALE_MATRIX = scale;

        // pan 1:1 function use global SCALE_MATRIX
        pan_btn('11');

        // pan
        $('svg').svgPan('viewport');

        var tree_group = document.getElementById('tree_group');
        tree_group.addEventListener('click', lineClickHandler, false);
        tree_group.addEventListener('contextmenu', lineContextMenuHandler, false);
        tree_group.addEventListener('mouseover',lineMouseEnterHandler, false);
        tree_group.addEventListener('mouseout', lineMouseLeaveHandler, false);
        document.body.addEventListener('mousemove', mouseMoveHandler, false); // for tooltip
    }
}