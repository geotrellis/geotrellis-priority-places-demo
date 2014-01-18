package pps

import geotrellis.process._
import geotrellis._
import geotrellis.source._
import geotrellis.raster._
import geotrellis.raster.op._
import geotrellis.feature._

import akka.actor.{ActorSystem, Props}
import akka.io.IO
import spray.can.Http

object Main {
  val server = Server("asheville",
                      Catalog.fromPath("data/catalog.json"))

  def main(args: Array[String]):Unit = {
    implicit val system = server.system

    // create and start our service actor
    val service = system.actorOf(Props[PriorityPlacesServiceActor], "pp-service")

    // start a new HTTP server on port 8080 with our service actor as the handler
    IO(Http) ! Http.Bind(service, "localhost", port = 8080)
  }
}
