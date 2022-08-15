<?xml version="1.0"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:output omit-xml-declaration="yes"/>

<xsl:template match="Fields"> 
    <xsl:value-of select="Tag"/>,<xsl:value-of select="FieldName"/> 
</xsl:template>

</xsl:stylesheet>
