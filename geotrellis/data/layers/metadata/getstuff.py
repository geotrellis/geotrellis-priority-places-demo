import os,sys
from lxml import etree
import json

dfs_xml = etree.XML(open("decision_factors.xml").read())
cats_xml = etree.XML(open("categories.xml").read())
dcmap_xml = etree.XML(open("categories_decision_factors.xml").read())

cat_ids = {}
for cat_xml in cats_xml.findall("category"):
    cat = { "layers" : [] }
    cat["id"] = cat_xml.find("id").text
    cat["name"] = cat_xml.find("name").text
    cat["position"] = cat_xml.find("position").text
    cat_ids[cat["id"]] = cat

print "There are %d categories." % len(cat_ids.values())

df_ids = {}
for df_xml in dfs_xml.findall("decision-factor"):
    df = { }
    df["is-mask"] = df_xml.find("is-mask").text
    df["description"] = df_xml.find("description").text
    df["name"] = df_xml.find("display-name").text
    df["layer"] = df_xml.find("layer-name").text
    df["id"] = df_xml.find("id").text
    df_ids[df["id"]] = df

print "There are %d decision factors." % len(df_ids.values())
    
for xml in dcmap_xml.findall("categories-decision-factor"):
    cat_ids[xml.find("category-id").text]["layers"].append(df_ids[xml.find("decision-factor-id").text])

o = { "categories" : list(cat_ids.values()) }

json.dump(o,open("factors.json",'w'),indent=2)
