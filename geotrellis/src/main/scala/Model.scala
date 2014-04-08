package pps

import geotrellis._
import geotrellis.source._
import geotrellis.raster.op.local.RasterReducer

object Model {
  def weightedOverlay(layers:Iterable[String], 
                      weights:Iterable[Int], 
                      rasterExtent:Option[RasterExtent]): RasterSource = {
    val weightedRasters = 
      layers
        .zip(weights)
        .map { case (layer, weight) =>
          val rs =
            rasterExtent match {
              case Some(re) => RasterSource(layer, re)
              case None => RasterSource(layer)
            }
          rs.localMultiply(weight)
        }

    val reducer =
      new RasterReducer({ (i1:Int, i2:Int) =>
        if(isNoData(i1)) { i2 }
        else if(isNoData(i2)) { i1 }
        else { i1 + i2 }
      })({ (d1: Double, d2: Double) =>
        if(isNoData(d1)) { d2 }
        else if(isNoData(d2)) { d1 }
        else { d1 + d2 }
      })

    weightedRasters.toList match {
      case head :: List() =>
        head
      case head :: tail =>
        head.combine(tail)(reducer(_))
    }
  }
}
