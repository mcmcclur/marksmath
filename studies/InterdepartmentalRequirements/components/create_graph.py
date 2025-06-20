import pygraphviz as pgv
import io

# def generate_edges(departments):
#     for dept in departments:
#         # Arrow should point toward current department
#         in_key = dept['abbreviation'].replace(' ', '_')
# 
#         # The sources are the requirements.
#         # This is a dict whose keys are the department with required courses
#         # and whose values are the number of required courses.
#         sources = {}
# 
#         # Each department may have several concentrations.
#         # We check the number of requirements for each 
#         # concentration and choose the maximum of these numbers.
#         for concentration in dept['concentrations']:
#             for osr in concentration['outside_requirements']:
#                 out_key = osr['abbreviation'].replace(' ','_')
#                 if out_key in sources:
#                     if len(osr['courses']) > sources[out_key]:
#                         sources[out_key] = len(osr['courses'])
#                 else:
#                     sources[out_key] = len(osr['courses'])
#         print(sources)
#     return sources

def create_graph(departments):
    G = pgv.AGraph(directed=True)
    for dept in departments:
        # Arrow should point toward current department
        in_key = dept['abbreviation'].replace(' ', '_')

        # The sources are the requirements.
        # This is a dict whose keys are the department with required courses
        # and whose values are the number of required courses.
        sources = {}

        # Each department may have several concentrations.
        # We check the number of requirements for each 
        # concentration and choose the maximum of these numbers.
        for concentration in dept['concentrations']:
            for osr in concentration['outside_requirements']:
                out_key = osr['abbreviation'].replace(' ','_')
                if out_key in sources:
                    if len(osr['courses']) > sources[out_key]:
                        sources[out_key] = len(osr['courses'])
                else:
                    sources[out_key] = len(osr['courses'])

        for source in sources:
            if source != "Ed" and in_key != "Ed":
                G.add_edge(
                    source.replace(' ','_'), 
                    in_key.replace(' ','_'), 
                    penwidth=int(sources[source]),
                    data=int(sources[source])
                )
    G.graph_attr["splines"] = "true"
    G.graph_attr["ratio"] = 0.62
    G.layout('dot')
    
    return G    

def serialize_graph(G):
    buf = io.BytesIO()
    G.draw(buf, format='svg', prog='dot')
    G_svg_str = buf.getvalue().decode('utf-8')
    return G_svg_str
    

def get_dependency_data(departments, G):
    edge_data = [(edge, int(G.get_edge(*edge).attr['penwidth']))
        for edge in G.edges()                          
    ]
    data = []
    non_data = []
    for dept in departments:
        name = dept['name']
        abbr = dept['abbreviation'].replace(' ', '_')
        in_data = sum([edge[1] for edge in edge_data if edge[0][1] == abbr])
        out_data = sum([edge[1] for edge in edge_data if edge[0][0] == abbr])
        if in_data>0 or out_data>0:
            data.append({
                'Department': name,
                'Abbreviation': abbr.replace('_', ' '),
                'Requirements': in_data,
                'Dependents': out_data
            })
        else:
            non_data.append(name)
    return {'data': data, 'non_data': non_data}
