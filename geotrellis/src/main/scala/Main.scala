package asheville

import geotrellis.rest.WebRunner
import geotrellis.process._
import geotrellis._
import geotrellis.raster._
import geotrellis.raster.op._
import geotrellis.feature._
import akka.actor.{ ActorRef, Props, Actor, ActorSystem }
import akka.cluster.routing.ClusterRouterConfig
import akka.cluster.routing.ClusterRouterSettings
import akka.cluster.routing.AdaptiveLoadBalancingRouter
import akka.cluster.routing.HeapMetricsSelector
import akka.cluster.routing.AdaptiveLoadBalancingRouter
import akka.cluster.routing.SystemLoadAverageMetricsSelector
import akka.routing.ConsistentHashingRouter
import akka.routing.FromConfig

case class TiledLayer(raster:Raster,tileRatios:Map[RasterExtent,LayerRatio])

object Main {
  val server = Server("asheville",
                      Catalog.fromPath("data/catalog.json"))

  // val router = server.system.actorOf(
  //     Props[ServerActor].withRouter(FromConfig),
  //     name = "clusterRouter")

  private var tiledLayers:Map[String,TiledLayer] = null

  val layers = List[String](
    // "ImperviousSurfaces_Barren Lands_Open Water" -> 1,
    // "DevelopedLand" -> 2,
    // "Wetlands" -> 3,
    // "ForestedLands" -> 4,
    // "Non-workingProtectedOrPublicLands" -> 5,
    // "PrimeAgriculturalSoilsNotForestedOrFarmland" -> 6,
    // "PublicallyOwnedWorkingLands" -> 7,
    // "PrivatelyOwnedWorkingLandsWithEasements" -> 8,
    // "FarmlandWithoutPrimeAgriculturalSoils" -> 9,
    // "FarmlandOrForestedLandsWithPrimeAgriculturalSoils" -> 10
  )

  def main(args: Array[String]):Unit = {
    try {
      val store = server.catalog.stores("factors")
      val op = 
        logic.Collect(
          (for(layer <- store.getNames) yield {
            io.LoadRaster(layer).map { r =>
              println(s"Caching tiled information for $layer")
              val tileLayerRatiosOp:Op[Seq[(RasterExtent,LayerRatio)]] =
                logic.Collect(r.getTileOpList.map { tileOp =>
                  tileOp.map { tile =>
                    (tile.rasterExtent, RatioOfOnes.rasterResult(tile))
                  }
                })
              (layer,TiledLayer(r,server.run(tileLayerRatiosOp).toMap))
            }
          }).toSeq
        ).map(_.toMap)
      tiledLayers = server.run(op)
    } catch {
      case e:Exception => 
        server.shutdown()
        println(s"Could not load tile set: $e.message")
        e.printStackTrace()
       return
    }

    WebRunner.main(args)
  }

  def getRasterExtent(polygon:Op[Geometry[_]]):Op[RasterExtent] = {
    val e = GetFeatureExtent(polygon)
    val rasterExtent = io.LoadRasterExtent("albers_Wetlands")
    extent.CropRasterExtent(rasterExtent,e)
  }

  def getTileLayer(layer:String) = {
    tiledLayers(layer)
  }
}

case class GetFeatureExtent(f:Op[Geometry[_]]) extends Op1(f)({
  (f) => {
    val env = f.geom.getEnvelopeInternal
    Result(Extent( env.getMinX(), env.getMinY(), env.getMaxX(), env.getMaxY() ))
  }
})

case class AsPolygon[D](g:Op[Geometry[D]]) extends Op1(g) ({
  g =>
    Result(Polygon[Int](g.asInstanceOf[Polygon[D]].geom,0))
})
