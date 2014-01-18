package pps

import geotrellis._
import geotrellis.source._
import geotrellis.render._
import geotrellis.services._

import java.io.File
import org.parboiled.common.FileUtils
import scala.concurrent.duration._
import akka.actor._
import akka.pattern.ask
import spray.routing.{HttpService, RequestContext}
import spray.routing.directives.CachingDirectives
import spray.can.server.Stats
import spray.can.Http
import spray.httpx.marshalling.Marshaller
import spray.httpx.encoding.Gzip
import spray.util._
import spray.http._
import MediaTypes._
import CachingDirectives._

class PriorityPlacesServiceActor extends Actor with PriorityPlacesService {
  def actorRefFactory = context
  def receive = runRoute(serviceRoute)
}

trait PriorityPlacesService extends HttpService {
  implicit def executionContext = actorRefFactory.dispatcher

  val directoryName = "/home/rob/proj/pp/priority-places/static/"

  val serviceRoute = {
    get {
      pathSingleSlash {
        redirect("index.html",StatusCodes.Found)
      } ~
      pathPrefix("gt") {
        path("colors") {
          complete(ColorRampMap.getJson)
        } ~
        path("breaks") {
          parameters('layers,
                     'weights,
                     'numBreaks.as[Int],
                     'mask ? "") {
            (layersParam,weightsParam,numBreaks,mask) => {
              val layers = layersParam.split(",")
              val weights = weightsParam.split(",").map(_.toInt)


              Model.weightedOverlay(layers,weights,None)
                .classBreaks(numBreaks)
                .run match {
                  case process.Complete(breaks, _) =>
                    val breaksArray = breaks.mkString("[", ",", "]")
                    val json = s"""{ "classBreaks" : $breaksArray }"""
                    complete(json)
                  case process.Error(message,trace) =>
                    failWith(new RuntimeException(message))
              }
            }
          }
        } ~
        path("wo") {
          parameters("SERVICE",
                     'REQUEST,
                     'VERSION,
                     'FORMAT,
                     'BBOX,
                     'HEIGHT.as[Int],
                     'WIDTH.as[Int],
                     'LAYERS,
                     'WEIGHTS,
                     'PALETTE ? "ff0000,ffff00,00ff00,0000ff",
                     'COLORS.as[Int] ? 4,
                     'BREAKS,
                     'COLORRAMP ? "colorRamp",
                     'MASK ? "") {
            (_,_,_,_,bbox,cols,rows,layersString,weightsString,
              palette,colors,breaksString,colorRamp,mask) => {
              val extent = Extent.fromString(bbox)

              val re = RasterExtent(extent, cols, rows)

              val layers = layersString.split(",")
              val weights = weightsString.split(",").map(_.toInt)

              val model = Model.weightedOverlay(layers,weights,Some(re))

              val breaks =
                breaksString.split(",").map(_.toInt)
              
              val ramp = {
                val cr = ColorRampMap.getOrElse(colorRamp,ColorRamps.BlueToRed)
                if(cr.toArray.length < breaks.length) { cr.interpolate(breaks.length) }
                else { cr }
              }

              val png:ValueSource[Png] = 
                model.renderPng(ramp, breaks)

              png.run match {
                case process.Complete(img,h) =>
                  respondWithMediaType(MediaTypes.`image/png`) {
                    complete(img)
                  }
                case process.Error(message,trace) =>
                  println(message)
                  println(trace)
                  println(re)

                  failWith(new RuntimeException(message))
              }
            }
          }
        }
      } ~
      pathPrefix("") {
        getFromDirectory(directoryName)
      }
    }
  }
}
