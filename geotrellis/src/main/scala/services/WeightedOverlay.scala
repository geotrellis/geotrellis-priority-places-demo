package pps.services

import pps._

import javax.servlet.http.HttpServletRequest
import javax.ws.rs._
import geotrellis._
import geotrellis.source._
import geotrellis.raster.op._
import geotrellis.statistics.op._
import geotrellis.rest._
import geotrellis.rest.op._
import geotrellis.raster._
import geotrellis.feature._
import geotrellis.feature.op.geometry.AsPolygonSet
import geotrellis.feature.rasterize.{Rasterizer, Callback}
import geotrellis.render.ColorRamps._

import geotrellis.data.geojson._
import geotrellis.util._

import javax.ws.rs.core.Context

import scala.collection.JavaConversions._

/**
 * Create a weighted overlay of the Chattanooga model.
 */
@Path("/wo")
class WeightedOverlay {
  final val defaultBox = "-9634947.090,4030964.877,-9359277.090,4300664.877"
  final val defaultColors = "ff0000,ffff00,00ff00,0000ff"

  @GET
  def get(
    @DefaultValue(defaultBox) @QueryParam("bbox") bbox:String,
    @DefaultValue("256") @QueryParam("cols") cols:Int,
    @DefaultValue("256") @QueryParam("rows") rows:Int,
    @DefaultValue("wm_ForestedLands") @QueryParam("layers") layers:String,
    @DefaultValue("1") @QueryParam("weights") weights:String,
    @DefaultValue("") @QueryParam("mask") mask:String,
    @DefaultValue(defaultColors) @QueryParam("palette") palette:String,
    @DefaultValue("4") @QueryParam("colors") numColors:String,
    @DefaultValue("") @QueryParam("breaks") breaks:String,
    @DefaultValue("blue-to-red") @QueryParam("colorRamp") colorRampKey:String,
    @Context req:HttpServletRequest
  ):core.Response = {
    val extent = {
      val Array(xmin,ymin,xmax,ymax) = bbox.split(",").map(_.toDouble)
      Extent(xmin,ymin,xmax,ymax)
    }

    val re = RasterExtent(extent,cols,rows)

    val layerNames = layers.split(",")
    val weightValues = weights.split(",").map(_.toInt)

    val wo = 
      layerNames.zip(weightValues)
                .map { case (name,weight) =>
                  RasterSource(name,re) * weight
                 }
                .reduce(_+_)

  //   val overlayOp = if(mask == "") { 
  //     modelOp
  //   } else {
  //     val poly = GeoJsonReader.parse(mask)
  //     val polygon = Polygon(srs.LatLong.transform(poly.geom,srs.WebMercator),0)


  //     // val reproj = Transformer.transform(feature,Projections.LatLong,Projections.WebMercator)
  // //    val polygon = Polygon(reproj.geom,0)

  //     val maskRaster = Rasterizer.rasterizeWithValue(polygon,re) { x => 1 }
  //     local.Mask(modelOp,maskRaster,NODATA,NODATA)
  //   }
 
    val breakValues = 
      breaks.split(",").map(_.toInt)
    
    val ramp = {
      val cr = Colors.rampMap.getOrElse(colorRampKey,BlueToRed)
      if(cr.toArray.length < breakValues.length) { cr.interpolate(breakValues.length) }
      else { cr }
    }

    val png = 
      wo.renderPng(ramp,breakValues)

//overlayOp.renderPng(ramp,breaks)//Render.operation(overlayOp,ramp,breaksOp)

    Main.server.getSource(png) match {
      case process.Complete(img,h) =>
        OK.png(img)
      case process.Error(message,trace) =>
        ERROR(message + " " + trace)
             .allowCORS()
    }
  }
}














