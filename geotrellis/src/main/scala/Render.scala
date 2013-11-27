package asheville

import geotrellis._
import geotrellis.render._
import geotrellis.render.op._

object Render {
  def operation(r:Op[Raster], ramp:Op[ColorRamp], breaks:Op[Array[Int]]) = {
    val colorBreaks = BuildColorBreaks(breaks,ramp.map { r => r.toArray} )

    RenderPng(r,colorBreaks,0)
  }
}
