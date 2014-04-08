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

import scala.util.Properties


object Main {
  val server = Server("asheville",
                      Catalog.fromPath("data/catalog.json"))

  def actorSystem = server.system

  def main(args: Array[String]):Unit = {
    implicit val system = actorSystem

    // create and start our service actor
    val service = system.actorOf(Props[PriorityPlacesServiceActor], "pp-service")

    // start a new HTTP server on port 8080 with our service actor as the handler
    val port = Properties.envOrElse("PORT", "8080").toInt
    IO(Http) ! Http.Bind(service, "0.0.0.0", port = port)
  }
}
