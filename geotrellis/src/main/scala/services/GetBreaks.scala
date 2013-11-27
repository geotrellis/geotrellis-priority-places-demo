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
import geotrellis.feature.op.geometry.AsPolygonSet
import geotrellis.feature.rasterize.{Rasterizer, Callback}

import javax.ws.rs.core.Context

import scala.collection.JavaConversions._
import scala.language.implicitConversions

case class ClassBreaksToJson(b:Op[Array[Int]]) extends Op1(b)({
  breaks => 
    val breaksArray = breaks.mkString("[", ",", "]")
    Result(s"""{ "classBreaks" : $breaksArray }""")
})

@Path("/breaks") 
class GetBreaks {
  final val defaultBox = "-9634947.090,4030964.877,-9359277.090,4300664.877"

  @GET
  def get(
    @DefaultValue(defaultBox) @QueryParam("bbox") bbox:String,
    @DefaultValue("256") @QueryParam("cols") cols:Int,
    @DefaultValue("256") @QueryParam("rows") rows:Int,
    @DefaultValue("wm_ForestedLands") @QueryParam("layers") layers:String,
    @DefaultValue("1") @QueryParam("weights") weights:String,
    @DefaultValue("") @QueryParam("mask") mask:String,
    @DefaultValue("10") @QueryParam("numBreaks") numBreaks:Int,
    @Context req:HttpServletRequest
  ):core.Response = {
    println("HERE")
    val extent = {
      val Array(xmin,ymin,xmax,ymax) = bbox.split(",").map(_.toDouble)
      Extent(xmin,ymin,xmax,ymax)
    }

    val re = RasterExtent(extent,cols,rows)

    val layerNames = layers.split(",")
    val weightValues = weights.split(",").map(_.toInt)

    val breaks = 
      layerNames
        .zip(weightValues)
        .map { case (name,weight) =>
          RasterSource(name,re) * weight
         }
        .reduce(_+_)
        .histogram
        .converge
        .map(_.getQuantileBreaks(numBreaks))
        .map { breaks =>
          val breaksArray = breaks.mkString("[", ",", "]")
          s"""{ "classBreaks" : $breaksArray }"""
        }


    // val classBreaks = stat.GetClassBreaks(histo, numBreaksOp)
//    val op = ClassBreaksToJson(classBreaks)
    
    Main.server.getSource(breaks) match {
      case process.Complete(json,h) =>
        OK.json(json)
          .allowCORS()
      case process.Error(message,trace) =>
        ERROR(message + " " + trace)
    }
  }
}
