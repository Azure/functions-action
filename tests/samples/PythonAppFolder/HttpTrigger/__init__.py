import logging

import json
from os import listdir, path, linesep, getcwd
import sys
import azure.functions
import azure.functions as func


def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request.')

    return func.HttpResponse(
    	body=json.dumps({
			"hello": "world",
    		"sys.path": str(sys.path),
    		"func.__path__": str(func.__path__),
    		"os.getcwd()": getcwd(),
    		"func.__version__": getattr(azure.functions, '__version__', '< 1.2.1'),
    		"python_version": f'{sys.version_info.major}.{sys.version_info.minor}'
    	}),
        status_code=200,
        mimetype='application/json'
    )
