import AssemblyKeys._

name := "Priority Places"

scalaVersion := "2.10.3"

resolvers ++=  Seq( 
  "Geotools" at "http://download.osgeo.org/webdav/geotools/",
  "spray repo" at "http://repo.spray.io",
  Resolver.sonatypeRepo("snapshots")
)

libraryDependencies ++= Seq(
  "com.azavea.geotrellis" %% "geotrellis" % "0.9.0-RC3",
  "com.azavea.geotrellis" %% "geotrellis-services" % "0.9.0-RC3",
  "io.spray" % "spray-routing" % "1.2.0",
  "io.spray" % "spray-client" % "1.2.0",
  "io.spray" %% "spray-json" % "1.2.5",
  "org.geotools" % "gt-main" % "8.0-M4"
)

assemblySettings

mergeStrategy in assembly <<= (mergeStrategy in assembly) {
  (old) => {
    case "reference.conf" => MergeStrategy.concat
    case "application.conf" => MergeStrategy.concat
    case "META-INF/MANIFEST.MF" => MergeStrategy.discard
    case "META-INF\\MANIFEST.MF" => MergeStrategy.discard
    case _ => MergeStrategy.first
  }
}

seq(Revolver.settings: _*)

fork in run := true
