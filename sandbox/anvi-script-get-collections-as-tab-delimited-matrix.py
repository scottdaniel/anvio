#!/usr/bin/env python
# -*- coding: utf-8

"""
Goes through the collections_* tables and creates a TAB delimited matrix based on
all available collections in a given contigs database.
"""

import argparse

import anvio
import anvio.tables as t
import anvio.dbops as dbops
import anvio.terminal as terminal 
import anvio.filesnpaths as filesnpaths


run = terminal.Run()
progress = terminal.Progress()

parser = argparse.ArgumentParser(description='A simple script to generate info from search tables')
parser.add_argument(*anvio.A('profile-db'), **anvio.K('profile-db', {'required': False}))
parser.add_argument(*anvio.A('contigs-db'), **anvio.K('contigs-db', {'required': False}))
parser.add_argument(*anvio.A('output-file'), **anvio.K('output-file', {'default': "COLLECTIONS.txt"}))

args = parser.parse_args()

filesnpaths.is_file_exists(args.output_file)

contigs = set([])
contig_lengths = {}

db = dbops.ContigsDatabase(args.contigs_db, quiet=False)
contigs_info_table = db.db.get_table_as_dict(t.contigs_info_table_name)
contig_lengths = dict([(c, contigs_info_table[c]['length']) for c in contigs_info_table])
db.disconnect()

db = dbops.ProfileDatabase(args.profile_db, quiet=False)
collections_splits_table = db.db.get_table_as_dict(t.collections_splits_table_name)
collections_info_table = db.db.get_table_as_dict(t.collections_info_table_name)
db.disconnect()

sources = collections_info_table.keys()

splits = {}
for entry in collections_splits_table.values():
    split = entry['split']
    source = entry['source']
    cluster_id = entry['cluster_id']

    if splits.has_key(split):
        splits[split][source] = cluster_id
    else:
        splits[split] = {source: cluster_id}


output = open(args.output_file, 'w')
output.write('split\t%s\n' % '\t'.join(sources))
for split in splits.keys():
    line = [split]
    for source in sources:
        if splits[split].has_key(source):
            line.append(splits[split][source])
        else:
            line.append(None)
    output.write('\t'.join(line) + '\n')
output.close()

run.info('Collections matrix', args.output_file)
