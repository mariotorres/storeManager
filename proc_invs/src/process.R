library(tidyverse)
library(readxl)
library(stringdist)


## ----------------------------------------
## Global Variables
## ----------------------------------------
the_labels <- c("Cocoon",
                "Eli Corame",
                "Ema Valdemosa",
                "Lessan",
                "Libertad",
                "D mosseli",
                "Neon Nyx",
                "Nicoletta",
                "Punto Blanco",
                "D Moseli",
                "Bianchi")

the_provs <- c("Cocoon",
               "Eli Corame",
               "Ema Valdemosa",
               "Lessan",
               "Libertad",
               "Neon Nyx",
               "Nicoletta",
               "Punto Blanco",
               "D Moseli",
               "Bianchi")

assign_prov_marca <- function(prov, the_field){
    if(is.na(prov)){
        return(length(the_field) + 1)
    }
    which.min(stringdist(prov,
                         the_field,
                         method = 'jaccard'))[1]
}



assign_m_prov <- function(prov, the_field){
    laply(prov, function(t) t <- assign_prov_marca(t, the_field))
}

## ----------------------------------------
## Read in data
## ----------------------------------------



###########################################
## GOOD Old trial iter
###########################################
data <- read_csv('./data/new_trial/imagen.csv') %>%
    `colnames<-` (c('modelo',
                    'existencias_ant',
                    'n_existencias',
                    'dev',
                    'precio',
                    'pzas_ve',
                    'to_ve',
                    'x_ve',
                    'descripcion')) %>%
    select(modelo, n_existencias, precio, descripcion) %>%
    filter(!is.na(modelo))

clean_data <- data %>%
    separate(modelo, into = c('modelo', 'proveedor'), sep = ' ') %>%
    filter(!is.na(modelo)) %>%
    mutate(modelo = str_extract(modelo, '[^\\*]+'),
           id_proveedor = assign_m_prov(proveedor, the_provs),
           id_marca = assign_m_prov(proveedor, the_labels),
           costo = precio,
           precio = costo * 2) 
    

clean_data$descripcion[is.na(clean_data$descripcion)] <- ''
clean_data$id_tienda <- 3
clean_data$notas <- ''

clean_data <- clean_data %>%
    select(modelo, n_existencias, precio, descripcion,
           id_proveedor, id_marca, costo, id_tienda, notas) %>%
    filter(costo > 0)

clean_data$articulo <- 'Prenda'

write.csv(clean_data, './output_data/new_trial/imagen.csv', row.names = FALSE)
