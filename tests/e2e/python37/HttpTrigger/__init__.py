import logging

import azure.functions as func
import pyodbc


def main(req: func.HttpRequest) -> func.HttpResponse:
    with open('sha.txt', 'r') as file:
        line = file.readline()
    return func.HttpResponse(line)
