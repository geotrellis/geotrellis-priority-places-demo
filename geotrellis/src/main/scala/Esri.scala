package pps

import com.typesafe.config.{ConfigFactory,Config}

import scala.concurrent._
import scala.concurrent.duration._
import spray.http._
import spray.util._
import spray.client.pipelining._
import spray.json.DefaultJsonProtocol
import spray.httpx.SprayJsonSupport._

object Esri {
  case class Token(access_token: String, expires_in: Int)

  object TokenFormat extends DefaultJsonProtocol {
    implicit val tokenFormat = DefaultJsonProtocol.jsonFormat2(Token)
  }
  import TokenFormat._

  def mapToJson: HttpResponse => HttpResponse = {
    case r@ HttpResponse(_, entity, _, _) =>
      r.withEntity(HttpEntity(ContentTypes.`application/json`, r.entity.data))
    case x => x
  }
  
  val generateTokenUrl = {
    val (usr, pwd) = {
      val config = ConfigFactory.load("credentials.conf")
      (config.getString("credentials.arcgis.oauthusr"), config.getString("credentials.arcgis.oauthpwd"))
    }
    s"https://www.arcgis.com/sharing/oauth2/token?client_id=$usr&grant_type=client_credentials&client_secret=$pwd&f=pjson"
  }

  val invalidateCatalogThreshold: Long = {
    val config = ConfigFactory.load()

    config.getLong("pp.esri.update-reports-catalog") * 1000
  }

  println(generateTokenUrl)

  private var reportsJson: String = ""
  private var lastUpdated: Long = 0

  def getAvailableReports(): String = {
    if(reportsJson.isEmpty || System.currentTimeMillis - lastUpdated > invalidateCatalogThreshold) {
      implicit val system = Main.actorSystem
      import system.dispatcher

      val tokenPipeline = sendReceive ~> mapToJson ~> unmarshal[Token]
      val catalogPipeline = sendReceive ~> unmarshal[String]

      val pipeline =
      tokenPipeline(Get(Esri.generateTokenUrl)).flatMap { token =>
        val url = s"http://geoenrich.arcgis.com/arcgis/rest/services/World/geoenrichmentserver/GeoEnrichment/Reports/US?f=json&token=${token.access_token}"
        catalogPipeline(Get(url))
      }

      reportsJson = Await.result(pipeline, 10 seconds)
      lastUpdated = System.currentTimeMillis
    }

    reportsJson
  }

}
