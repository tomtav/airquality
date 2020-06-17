# import dependencies
import os
import numpy as np
import pandas as pd
import pymongo
from datetime import datetime, timedelta

from flask import (
    Flask, flash, jsonify, render_template, send_from_directory, url_for
)


def create_app():

    # Connect to database
    conn = 'mongodb://localhost:27017'
    client = pymongo.MongoClient(conn)

    # Declare the database
    db = client.mars_db

    # Declare the collection
    collection = db.news

    app = Flask(__name__, instance_relative_config=True)

    @app.route('/favicon.ico')
    def favicon():
        """Website Icon"""
        return send_from_directory(os.path.join(app.root_path, 'static'), 'favicon.ico', mimetype='image/vnd.microsoft.icon')

    @app.route('/', methods=['GET'])
    def home():
        """Dashboard"""

        try:
            document = collection.find({}).sort(
                "modified", pymongo.DESCENDING).limit(1)[0]
        except:
            document = {}

        return render_template('content.html', data=document)

    return app
