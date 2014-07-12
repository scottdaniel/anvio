/**
 *
 * Javascript library to display phylogenetic trees
 *
 */

//--------------------------------------------------------------------------------------------------
function drawLegend() {
	var left = total_radius + 100;
	var top = 20 - total_radius;

	for (var i = 0; i < taxonomy_ids.length; i++) {
		// collect taxonomy data
		var pindex = taxonomy_ids[i];
		var taxonomy_title = metadata[0][pindex];

		var names = new Array();
		var colors = new Array();

		for (var name in taxonomy_colors[pindex]) {
			names.push(name);
		}

		names.sort();

		// draw border
		drawRectangle('viewport', left - 10, top - 20, (names.length + 2.5) * 20, 200, 'white', 1, 'black');

		drawText('viewport', {
			'x': left,
			'y': top
		}, taxonomy_title, '16px');

		for (var j = 0; j < names.length; j++) {
			var name = names[j];

			top = top + 20;
			var rect = drawRectangle('viewport', left, top, 16, 16, taxonomy_colors[pindex][name], 1, 'black',
				null,
				function() {
					// mouseenter
					$(this).css('stroke-width', '2');
				},
				function() {
					// mouseleave
					$(this).css('stroke-width', '1');
				});

			rect.setAttribute('name', name);

			$(rect).colpick({
				layout: 'hex',
				submit: 0,
				colorScheme: 'light',
				onChange: function(hsb, hex, rgb, el, bySetColor) {
					$(el).css('fill', '#' + hex);
					taxonomy_colors[pindex][$(el).attr('name')] = '#' + hex;
				}
			});

			drawText('viewport', {
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

	drawRectangle('viewport', left - 10, top - 20, (groups_to_draw.length + 2.5) * 20, 200, 'white', 1, 'black');
	drawText('viewport', {
		'x': left,
		'y': top
	}, "Groups", '16px');

	for (var j = 0; j < groups_to_draw.length; j++) {
		gid = groups_to_draw[j];
		top = top + 20;

		drawRectangle('viewport', left, top, 16, 16, $('#group_color_' + gid).attr('color'), 1, 'black');
		drawText('viewport', {
			'x': left + 30,
			'y': top + 8
		}, $('#group_name_' + gid).val(), '12px');
	}
}


function drawLine(svg_id, p, p0, p1) {
	var line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
	line.setAttribute('id', 'line' + p.id);

	var n = new NodeIterator(p);
	var q = n.Begin();

	var child_nodes = [];
	var rectangles = [];
	while (q != null) {
		child_nodes.push(q.id);
		q = n.Next();
	}

	$(line).click(function() {
		var group_id = $('input[type=radio]:checked').val();

		if (group_id < 1)
			return;

		for (var i = 0; i < child_nodes.length; i++) {
			var pos = $.inArray(child_nodes[i], SELECTED[group_id]);
			if (pos == -1) {
				SELECTED[group_id].push(child_nodes[i]);
			} else {
				SELECTED[group_id].splice(pos, 1);
			}

			// remove nodes from other groups
			for (var gid = 1; gid <= group_counter; gid++) {
				// don't remove nodes from current group
				if (gid == group_id)
					continue;

				var pos = $.inArray(child_nodes[i], SELECTED[gid]);
				if (pos > -1) {
					SELECTED[gid].splice(pos, 1);
				}
			}

		}

		// count contigs and update group labels
		for (var gid = 1; gid <= group_counter; gid++) {
			var contigs = 0;

			for (var j = 0; j < SELECTED[gid].length; j++) {
				if (id_to_node_map[SELECTED[gid][j]].IsLeaf())
					contigs++;
			}

			$('#contig_count_' + gid).val(contigs);
		}
	});

	$(line).mouseenter(function() {
		var group_id = $('input[type=radio]:checked').val();

		if (group_id < 1)
			return;

		var group_color = $('#group_color_' + group_id).attr('color');

		var p1 = p;
		while (p1.child) {
			p1 = p1.child;
		}

		var p2 = p;

		while (p2.child) {
			p2 = p2.child.GetRightMostSibling();
		}

		drawPie('viewport',
			'hover',
			p1.angle - angle_per_leaf / 2,
			p2.angle + angle_per_leaf / 2,
			distance(p.backarc, {
				'x': 0,
				'y': 0
			}),
			total_radius,
			0,
			group_color,
			'',
			0.3,
			false);

		for (var index = 0; index < child_nodes.length; index++) {
			$("#line" + child_nodes[index]).css('stroke-width', '3');
			$("#arc" + child_nodes[index]).css('stroke-width', '3');



			if ($.inArray(child_nodes[index], SELECTED[group_id]) > -1) {
				$("#line" + child_nodes[index]).css('stroke', LINE_COLOR);
				$("#arc" + child_nodes[index]).css('stroke', LINE_COLOR);
			} else {
				$("#line" + child_nodes[index]).css('stroke', group_color);
				$("#arc" + child_nodes[index]).css('stroke', group_color);
			}
		}
	});

	$(line).mouseleave(function() {
		$('#path_hover').remove();

		var group_id = $('input[type=radio]:checked').val();

		if (group_id < 1) {
			document.focus();
			return;
		}

		for (var index = 0; index < child_nodes.length; index++) {
			$("#line" + child_nodes[index]).css('stroke-width', '1');
			$("#arc" + child_nodes[index]).css('stroke-width', '1');
		}

		var node_stack = [];
		for (var gid = 1; gid <= group_counter; gid++) {
			var group_color = $('#group_color_' + gid).attr('color');

			for (var i = 0; i < SELECTED[gid].length; i++) {
				node_stack.push(SELECTED[gid][i]);

				$("#line" + SELECTED[gid][i]).css('stroke', group_color);
				$("#arc" + SELECTED[gid][i]).css('stroke', group_color);
				$("#line" + SELECTED[gid][i]).css('stroke-width', '2');
				$("#arc" + SELECTED[gid][i]).css('stroke-width', '2');
			}
		}

		for (var i = 0; i < child_nodes.length; i++) {
			if ($.inArray(child_nodes[i], node_stack) > -1)
				continue;

			$("#line" + child_nodes[i]).css('stroke', LINE_COLOR);
			$("#arc" + child_nodes[i]).css('stroke', LINE_COLOR);
		}
		document.focus();
	});

	line.setAttribute('vector-effect', 'non-scaling-stroke');
	line.setAttribute('style', 'stroke:' + LINE_COLOR + ';stroke-width:1;');
	line.setAttribute('d', linePath(p0, p1));

	var svg = document.getElementById(svg_id);
	svg.appendChild(line);
}

//--------------------------------------------------------------------------------------------------
function drawText(svg_id, p, string, font_size) {

	var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
	//newLine.setAttribute('id','node' + p.id);
	text.setAttribute('style', 'alignment-baseline:middle');
	text.setAttribute('x', p['x']);
	text.setAttribute('y', p['y']);
	text.setAttribute('font-size', font_size);

	var textNode = document.createTextNode(string)
	text.appendChild(textNode);

	var svg = document.getElementById(svg_id);
	svg.appendChild(text);
}

//--------------------------------------------------------------------------------------------------
function drawRotatedText(svg_id, p, string, angle, align) {
	var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
	//newLine.setAttribute('id','node' + p.id);
	text.setAttribute('style', 'alignment-baseline:middle');
	text.setAttribute('x', p['x']);
	text.setAttribute('y', p['y']);

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

function drawDottedLine(svg_id, angle, start_radius, end_radius) {
	var line = document.createElementNS('http://www.w3.org/2000/svg', 'path');

	var ax = Math.cos(angle) * start_radius;
	var ay = Math.sin(angle) * start_radius;

	var bx = Math.cos(angle) * end_radius;
	var by = Math.sin(angle) * end_radius;

	var path = new Array("M", ax, ay, "L", bx, by);

	line.setAttribute('d', path.join(" "));
	line.setAttribute('stroke', LINE_COLOR);
	line.setAttribute('stroke-opacity', '0.2');
	line.setAttribute('vector-effect', 'non-scaling-stroke');
	line.setAttribute('stroke-dasharray', '1,1');
	line.setAttribute('stroke-width', '1');

	var svg = document.getElementById(svg_id);
	svg.appendChild(line);
}

function drawPie(svg_id, id, start_angle, end_angle, inner_radius, outer_radius, large_arc_flag, color, content, fill_opacity, pointer_events) {
	var pie = document.createElementNS('http://www.w3.org/2000/svg', 'path');

	if (start_angle > end_angle) {
		// swap 
		var t = end_angle;
		end_angle = start_angle;
		start_angle = t;
	}

	$(pie).click(function() {
		$('#line' + id).trigger('click');
	});

	$(pie).mouseenter(function() {
		$('#line' + id).trigger('mouseenter');
	});
	$(pie).mouseleave(function() {
		$('#aToolTip').hide();
		$('#line' + id).trigger('mouseleave');
	});

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
		"A", inner_radius, inner_radius, 0, large_arc_flag, (large_arc_flag == 1) ? 0 : 1, bx, by, // inner arc
		"L", cx, cy, // line 1
		"A", outer_radius, outer_radius, 0, large_arc_flag, (large_arc_flag == 1) ? 1 : 0, dx, dy, // outer arc
		"Z"); // close path line 2

	pie.setAttribute('id', 'path_' + id);
	pie.setAttribute('fill', color);
	pie.setAttribute('stroke-width', '0');
	pie.setAttribute('shape-rendering', 'auto');
	//pie.setAttribute('stroke', 'black');
	pie.setAttribute('d', path.join(" "));
	pie.setAttribute('fill-opacity', fill_opacity);

	if (content.length > 0) {
		pie.setAttribute('title', content);
	}

	if (!pointer_events)
		pie.setAttribute('pointer-events', 'none');

	var svg = document.getElementById(svg_id);
	svg.appendChild(pie);
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

	$(arc).click(function() {
		$('#line' + p.id).click();
	});

	$(arc).mouseenter(function() {
		$('#line' + p.id).mouseenter();
	});
	$(arc).mouseleave(function() {
		$('#line' + p.id).mouseleave();
	});

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

	drawLine(this.settings.svg_id, p, p0, p1);
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
	var viewport = document.getElementById(this.settings.svg_id);
	viewport.setAttribute('transform', 'translate(' + (this.settings.width + this.root_length) / 2 + ' ' + this.settings.height / 2 + ')');
}

function draw_tree(drawing_type) {

	id_to_node_map = new Array();
	var t = new Tree();

	newick = newick.trim(newick);
	t.Parse(newick);

	//------------------- parse metadata
	var metadata_title = new Array();
	var metadata_dict = new Array();

	for (var index = 1; index < metadata.length; index++) {
		var params = metadata[index];
		metadata_dict[params[0]] = params.slice(0); // to avoid reference between metadata and after normalization metadata

		var title = [];
		title.push("<b>" + metadata[index][0] + "</b>");
		for (var pindex = 1; pindex < params.length; pindex++) {
			//title.push("<b>[" + pindex + "] " + metadata[0][pindex] + ": </b>" + metadata[index][pindex]);
			title.push("<b>" + metadata[0][pindex] + ": </b>" + metadata[index][pindex]);
		}
		metadata_title[params[0]] = title;
	}

	// ---------- metadata normalization
	var param_max = new Array();

	for (var id in metadata_dict) {
		for (var pindex = 1; pindex < metadata_dict[id].length; pindex++) {
			if (!isNumber(metadata_dict[id][pindex])) // skip for taxonomy
				continue;

			if ($('#normalization' + pindex).val() == 'sqrt') {
				metadata_dict[id][pindex] = Math.sqrt(parseFloat(metadata_dict[id][pindex]));
			}
			if ($('#normalization' + pindex).val() == 'log') {
				metadata_dict[id][pindex] = log10(parseFloat(metadata_dict[id][pindex]) + 1);
			}
			if (typeof param_max[pindex] === 'undefined' || parseFloat(metadata_dict[id][pindex]) > parseFloat(param_max[pindex])) {
				param_max[pindex] = parseFloat(metadata_dict[id][pindex]);
			}
		}
	}

	for (var id in metadata_dict) {
		for (var pindex = 1; pindex < metadata_dict[id].length; pindex++) {
			if (!isNumber(metadata_dict[id][pindex])) // skip for taxonomy
				continue;

			metadata_dict[id][pindex] = (parseFloat(metadata_dict[id][pindex]) * parseFloat($('#height' + pindex).val())) / parseFloat(param_max[pindex]);
		}
	}

	if (t.error != 0) {
		alert('Error parsing tree');
	} else {
		t.ComputeWeights(t.root);

		var td = null;

		var selectmenu = document.getElementById('style');

		switch (drawing_type) {
			case 'phylogram':
				if (t.has_edge_lengths) {
					td = new PhylogramTreeDrawer();
				} else {
					td = new RectangleTreeDrawer();
				}
				break;

			case 'circlephylogram':
				if (t.has_edge_lengths) {

					td = new CirclePhylogramDrawer();
				} else {

					td = new CircleTreeDrawer();
				}
				break;
		}

		// clear existing diagram, if any
		var svg = document.getElementById('svg');
		while (svg.hasChildNodes()) {
			svg.removeChild(svg.lastChild);
		}

		// create new group
		var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
		g.setAttribute('id', 'viewport');
		svg.appendChild(g);


		td.Init(t, {
			svg_id: 'viewport',
			width: VIEWER_WIDTH,
			height: VIEWER_HEIGHT,
			fontHeight: 10,
			root_length: 0.1
		});

		td.CalcCoordinates();
		td.Draw();

		// calculate max radius of tree
		var max_tree_radius = 0;

		var n = new NodeIterator(t.root);
		var q = n.Begin();

		while (q != null) {
			if (q.radius > max_tree_radius)
				max_tree_radius = q.radius;
			q = n.Next();
		}

		//
		var draw_offset = new Array();
		var margin = parseFloat($('#layer-margin').val());

		draw_offset[0] = max_tree_radius;

		for (var pindex = 1; pindex < parameter_count; pindex++) {
			draw_offset[pindex] = margin + draw_offset[pindex - 1] + parseFloat($('#height' + pindex).val());
		}

		total_radius = draw_offset[draw_offset.length - 1];


		// label leaves...

		var n = new NodeIterator(t.root);
		var q = n.Begin();

		//angle_per_leaf = 2 * Math.PI / t.num_leaves;
		var angle_max = parseFloat($('#angle-max').val());
		var angle_min = parseFloat($('#angle-min').val());

		angle_per_leaf = Math.toRadians(angle_max - angle_min) / t.num_leaves;

		var draw_reference_lines = $('#draw_reference_lines')[0].checked;
		while (q != null) {
			if (q.IsLeaf()) {
				switch (drawing_type) {
					case 'circle':
					case 'circlephylogram':
						if (draw_reference_lines)
							drawDottedLine('viewport', q.angle, q.radius, total_radius);

						for (var pindex = 1; pindex < parameter_count; pindex++) {

							var tooltip_arr = metadata_title[q.label].slice(0);
							tooltip_arr[pindex] = '<font color="lime">' + tooltip_arr[pindex] + '</font>'
							var tooltip = tooltip_arr.join('<br />\n');

							var isTaxonomy = $.inArray(pindex, taxonomy_ids) > -1 ? true : false;
							var color;

							if (isTaxonomy) {
								if (typeof taxonomy_colors[pindex][metadata_dict[q.label][pindex]] === 'undefined')
									taxonomy_colors[pindex][metadata_dict[q.label][pindex]] = randomColor();

								color = taxonomy_colors[pindex][metadata_dict[q.label][pindex]];
							} else {
								color = $('#picker' + pindex).attr('color');
							}

							if (!isTaxonomy) {
								drawPie('viewport',
									q.id,
									q.angle - angle_per_leaf / 2,
									q.angle + angle_per_leaf / 2,
									draw_offset[pindex - 1] + margin,
									draw_offset[pindex],
									0,
									color,
									tooltip,
									0.3,
									true);
							}

							drawPie('viewport',
								q.id,
								q.angle - angle_per_leaf / 2,
								q.angle + angle_per_leaf / 2,
								draw_offset[pindex - 1] + margin, (isTaxonomy) ? draw_offset[pindex] : draw_offset[pindex - 1] + metadata_dict[q.label][pindex] + margin,
								0,
								color,
								tooltip,
								1,
								true);
						}

						break;
					case 'cladogram':
					case 'rectanglecladogram':
					case 'phylogram':
					default:
						drawText('viewport', q.xy, metadata_dict[q.label]);
						break;
				}
			}
			q = n.Next();
		}

		drawLegend();

		// Scale to fit window
		var bbox = svg.getBBox();
		var scale = Math.min(td.settings.width / bbox.width, td.settings.height / bbox.height) * 0.75;
		SCALE_MATRIX = scale;

		// pan 1:1 function use global SCALE_MATRIX
		pan_btn('11');

		// pan
		$('svg').svgPan('viewport');
	}
}