FROM amazoncorretto:11

ENV CEREBRO_VERSION 0.9.4

RUN  yum -y upgrade \
 && yum install -y wget tar gzip shadow-utils \
 && yum clean all && rm -rf /var/cache/yum \
 && mkdir -p /opt/cerebro/logs \
 && wget -qO- https://github.com/lmenezes/cerebro/releases/download/v${CEREBRO_VERSION}/cerebro-${CEREBRO_VERSION}.tgz \
  | tar xzv --strip-components 1 -C /opt/cerebro \
 && sed -i '/<appender-ref ref="FILE"\/>/d' /opt/cerebro/conf/logback.xml \
 && groupadd -g 1000 cerebro \
 && adduser -g 1000 -u 1000 cerebro \
 && chown -R cerebro:cerebro /opt/cerebro

WORKDIR /opt/cerebro
USER cerebro

ENTRYPOINT [ "/opt/cerebro/bin/cerebro" ]
