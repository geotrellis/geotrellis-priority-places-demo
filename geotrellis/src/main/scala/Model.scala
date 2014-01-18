package pps

import geotrellis._
import geotrellis.source._

object Model {
  def weightedOverlay(layers:Iterable[String], 
                      weights:Iterable[Int], 
                      rasterExtent:Option[RasterExtent]): RasterSource =
    layers
      .zip(weights)
      .map { case (layer, weight) =>
//        println(s"LAYER `$layer` WEIGHT `$weight`")
        val rs = 
          rasterExtent match {
            case Some(re) => RasterSource(layer, re)
            case None => RasterSource(layer)
          }
        rs.localMultiply(weight)
       }
      .localAdd
}
